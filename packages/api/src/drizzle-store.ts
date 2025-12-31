/**
 * Drizzle-based session store for express-session
 * Replaces MongoStore with SQLite/Turso backend
 */

import * as session from 'express-session';
import { sql, type DrizzleDb } from '@unchainedshop/store';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { eq, and, or, isNull, gt } from 'drizzle-orm';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api');

// Session table schema
export const sessions = sqliteTable('sessions', {
  _id: text('_id').primaryKey(),
  session: text('session', { mode: 'json' }).$type<session.SessionData>().notNull(),
  expires: integer('expires', { mode: 'timestamp' }),
  lastModified: integer('lastModified', { mode: 'timestamp' }),
});

export interface DrizzleStoreOptions {
  db: DrizzleDb;
  ttl?: number; // Time to live in seconds (default: 14 days)
  touchAfter?: number; // Only update session after this many seconds (default: 0 = always)
  autoRemove?: 'interval' | 'disabled'; // Auto-remove expired sessions
  autoRemoveInterval?: number; // Interval in minutes for auto-remove (default: 10)
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export default class DrizzleStore extends session.Store {
  private db: DrizzleDb;
  private ttl: number;
  private touchAfter: number;
  private timer?: NodeJS.Timeout;
  private initialized: Promise<void>;

  constructor(options: DrizzleStoreOptions) {
    super();
    logger.debug('create DrizzleStore instance');

    this.db = options.db;
    this.ttl = options.ttl ?? 1209600; // 14 days default
    this.touchAfter = options.touchAfter ?? 0;

    // Initialize schema
    this.initialized = this.initSchema();

    // Setup auto-remove if enabled
    if (options.autoRemove !== 'disabled') {
      const interval = (options.autoRemoveInterval ?? 10) * 1000 * 60;
      this.timer = setInterval(() => this.removeExpired(), interval);
      this.timer.unref();
    }
  }

  private async initSchema(): Promise<void> {
    await this.db.run(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        _id TEXT PRIMARY KEY,
        session TEXT NOT NULL,
        expires INTEGER,
        lastModified INTEGER
      )
    `);
    // Create index on expires for efficient cleanup
    await this.db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires)
    `);
  }

  private async removeExpired(): Promise<void> {
    try {
      const now = new Date();
      await this.db.delete(sessions).where(sql`${sessions.expires} < ${now}`);
    } catch (error) {
      logger.error('Error removing expired sessions', { error });
    }
  }

  static create(options: DrizzleStoreOptions): DrizzleStore {
    return new DrizzleStore(options);
  }

  get(sid: string, callback: (err: any, session?: session.SessionData | null) => void): void {
    (async () => {
      try {
        await this.initialized;
        logger.debug(`DrizzleStore#get=${sid}`);

        const now = new Date();
        const result = await this.db
          .select()
          .from(sessions)
          .where(and(eq(sessions._id, sid), or(isNull(sessions.expires), gt(sessions.expires, now))))
          .limit(1);

        const internalSession = result[0];
        if (!internalSession) {
          logger.debug(`DrizzleStore#get session not found for ${sid}`);
          this.emit('get', sid);
          return callback(null, null);
        }
        logger.debug(`DrizzleStore#get found session for ${sid}`);

        // Handle case where session might be stored as a JSON string
        let sessionData: session.SessionData;
        if (typeof internalSession.session === 'string') {
          try {
            sessionData = JSON.parse(internalSession.session);
            logger.debug(`DrizzleStore#get parsed JSON session for ${sid}`, { sessionData });
          } catch {
            logger.error(`Failed to parse session data for ${sid}`);
            return callback(null, null);
          }
        } else {
          sessionData = internalSession.session as session.SessionData;
          logger.debug(`DrizzleStore#get object session for ${sid}`, { sessionData });
        }

        // Add lastModified if touchAfter is enabled
        if (this.touchAfter > 0 && internalSession.lastModified) {
          (sessionData as session.SessionData & { lastModified?: Date }).lastModified =
            internalSession.lastModified;
        }

        this.emit('get', sid);
        callback(null, sessionData);
      } catch (error) {
        callback(error);
      }
    })();
  }

  set(sid: string, sessionData: session.SessionData, callback: (err: any) => void = noop): void {
    (async () => {
      try {
        await this.initialized;
        logger.debug(`DrizzleStore#set=${sid}`);

        // Remove lastModified from session data before storing
        const sessionWithMeta = sessionData as session.SessionData & { lastModified?: Date };
        if (this.touchAfter > 0 && sessionWithMeta.lastModified) {
          delete sessionWithMeta.lastModified;
        }

        // Calculate expiration
        let expires: Date;
        if (sessionData?.cookie?.expires) {
          expires = new Date(sessionData.cookie.expires);
        } else {
          expires = new Date(Date.now() + this.ttl * 1000);
        }

        const lastModified = this.touchAfter > 0 ? new Date() : null;

        // Upsert session
        const existing = await this.db
          .select({ _id: sessions._id })
          .from(sessions)
          .where(eq(sessions._id, sid))
          .limit(1);

        if (existing.length > 0) {
          await this.db
            .update(sessions)
            .set({
              session: sessionData,
              expires,
              lastModified,
            })
            .where(eq(sessions._id, sid));
          this.emit('update', sid);
        } else {
          await this.db.insert(sessions).values({
            _id: sid,
            session: sessionData,
            expires,
            lastModified,
          });
          this.emit('create', sid);
        }

        this.emit('set', sid);
        callback(null);
      } catch (error) {
        callback(error);
      }
    })();
  }

  touch(
    sid: string,
    sessionData: session.SessionData & { lastModified?: Date },
    callback: (err: any) => void = noop,
  ): void {
    (async () => {
      try {
        await this.initialized;
        logger.debug(`DrizzleStore#touch=${sid}`);

        const touchAfterMs = this.touchAfter * 1000;
        const lastModified = sessionData.lastModified ? sessionData.lastModified.getTime() : 0;
        const currentDate = new Date();

        // Skip if within touchAfter window
        if (touchAfterMs > 0 && lastModified > 0) {
          const timeElapsed = currentDate.getTime() - lastModified;
          if (timeElapsed < touchAfterMs) {
            logger.debug(`Skip touching session=${sid}`);
            return callback(null);
          }
        }

        // Calculate new expiration
        let expires: Date;
        if (sessionData?.cookie?.expires) {
          expires = new Date(sessionData.cookie.expires);
        } else {
          expires = new Date(Date.now() + this.ttl * 1000);
        }

        await this.db
          .update(sessions)
          .set({
            expires,
            lastModified: touchAfterMs > 0 ? currentDate : undefined,
          })
          .where(eq(sessions._id, sid));

        // Check if session was found (SQLite doesn't return matched count directly)
        const existing = await this.db
          .select({ _id: sessions._id })
          .from(sessions)
          .where(eq(sessions._id, sid))
          .limit(1);

        if (existing.length === 0) {
          return callback(new Error('Unable to find the session to touch'));
        }

        this.emit('touch', sid, sessionData);
        callback(null);
      } catch (error) {
        callback(error);
      }
    })();
  }

  all(
    callback: (
      err: any,
      obj?: session.SessionData[] | Record<string, session.SessionData> | null,
    ) => void,
  ): void {
    (async () => {
      try {
        await this.initialized;
        logger.debug('DrizzleStore#all()');

        const now = new Date();
        const results = await this.db
          .select()
          .from(sessions)
          .where(or(isNull(sessions.expires), gt(sessions.expires, now)));

        const sessionDataList = results.map((r) => r.session as session.SessionData);

        this.emit('all', sessionDataList);
        callback(null, sessionDataList);
      } catch (error) {
        callback(error);
      }
    })();
  }

  destroy(sid: string, callback: (err: any) => void = noop): void {
    (async () => {
      try {
        await this.initialized;
        logger.debug(`DrizzleStore#destroy=${sid}`);

        await this.db.delete(sessions).where(eq(sessions._id, sid));

        this.emit('destroy', sid);
        callback(null);
      } catch (error) {
        callback(error);
      }
    })();
  }

  length(callback: (err: any, length?: number) => void): void {
    (async () => {
      try {
        await this.initialized;
        logger.debug('DrizzleStore#length()');

        const result = await this.db.select({ count: sql<number>`count(*)` }).from(sessions);
        callback(null, result[0]?.count ?? 0);
      } catch (error) {
        callback(error);
      }
    })();
  }

  clear(callback: (err: any) => void = noop): void {
    (async () => {
      try {
        await this.initialized;
        logger.debug('DrizzleStore#clear()');

        await this.db.delete(sessions);

        callback(null);
      } catch (error) {
        callback(error);
      }
    })();
  }

  close(): void {
    logger.debug('DrizzleStore#close()');
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
