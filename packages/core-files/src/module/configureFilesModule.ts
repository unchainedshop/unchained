import { emit, registerEvents } from '@unchainedshop/events';
import {
  eq,
  and,
  ne,
  inArray,
  sql,
  lt,
  generateId,
  type DrizzleDb,
  type SQL,
} from '@unchainedshop/store';
import { mediaObjects, type MediaObjectRow } from '../db/schema.ts';
import { filesSettings, type FilesSettingsOptions } from '../files-settings.ts';

export interface File {
  _id: string;
  expires: Date | null;
  path: string;
  meta?: Record<string, unknown>;
  name: string;
  size?: number;
  type?: string;
  url?: string;
  created: Date;
  updated?: Date;
}

export type SignedFileUpload = File & {
  putURL: string;
};

const FILE_EVENTS: string[] = ['FILE_CREATE', 'FILE_UPDATE', 'FILE_REMOVE'];

export interface FileQuery {
  fileIds?: string[];
  excludeFileId?: string;
  path?: string;
  paths?: string[];
  meta?: Record<string, any>;
  createdBefore?: Date;
}

export type FileFields = keyof File;

export interface FileQueryOptions {
  fields?: FileFields[];
}

const COLUMNS = {
  _id: mediaObjects._id,
  path: mediaObjects.path,
  name: mediaObjects.name,
  size: mediaObjects.size,
  type: mediaObjects.type,
  url: mediaObjects.url,
  expires: mediaObjects.expires,
  meta: mediaObjects.meta,
  created: mediaObjects.created,
  updated: mediaObjects.updated,
} as const;

const buildSelectColumns = (fields?: FileFields[]) => {
  if (!fields?.length) return undefined;
  return Object.fromEntries(
    fields.map((field) => [field, COLUMNS[field as keyof typeof COLUMNS]]),
  ) as Partial<typeof COLUMNS>;
};

const rowToFile = (row: MediaObjectRow): File => ({
  _id: row._id,
  path: row.path,
  name: row.name,
  size: row.size ?? undefined,
  type: row.type ?? undefined,
  url: row.url ?? undefined,
  expires: row.expires ?? null,
  meta: row.meta ? JSON.parse(row.meta) : undefined,
  created: row.created,
  updated: row.updated ?? undefined,
});

export const configureFilesModule = async ({
  db,
  options: filesOptions = {},
}: {
  db: DrizzleDb;
  options?: FilesSettingsOptions;
}) => {
  registerEvents(FILE_EVENTS);

  // Settings
  await filesSettings.configureSettings(filesOptions);

  return {
    normalizeUrl: (url: string, params: Record<string, any>): string => {
      const { ROOT_URL = 'http://localhost:4010' } = process.env;

      const transformedURLString = filesSettings.transformUrl(url, params);
      if (URL.canParse(transformedURLString)) {
        const finalURL = new URL(transformedURLString);
        return finalURL.href;
      } else if (URL.canParse(transformedURLString, ROOT_URL)) {
        const finalURL = new URL(transformedURLString, ROOT_URL);
        return finalURL.href;
      }
      return transformedURLString;
    },

    findFile: async (params: { fileId: string } | { url: string }) => {
      if ('url' in params) {
        const [row] = await db
          .select()
          .from(mediaObjects)
          .where(eq(mediaObjects.url, params.url))
          .limit(1);
        return row ? rowToFile(row) : null;
      }
      const [row] = await db
        .select()
        .from(mediaObjects)
        .where(eq(mediaObjects._id, params.fileId))
        .limit(1);
      return row ? rowToFile(row) : null;
    },

    findFiles: async (query: FileQuery, options?: FileQueryOptions): Promise<File[]> => {
      const conditions: SQL<unknown>[] = [];

      if (query.fileIds?.length) {
        conditions.push(inArray(mediaObjects._id, query.fileIds));
      }
      if (query.excludeFileId) {
        conditions.push(ne(mediaObjects._id, query.excludeFileId));
      }
      if (query.path) {
        conditions.push(eq(mediaObjects.path, query.path));
      }
      if (query.paths?.length) {
        conditions.push(inArray(mediaObjects.path, query.paths));
      }
      if (query.meta) {
        // For meta queries, we need to use JSON extraction
        for (const [key, value] of Object.entries(query.meta)) {
          conditions.push(
            sql`json_extract(${mediaObjects.meta}, '$."${sql.raw(key)}"') = ${JSON.stringify(value)}`,
          );
        }
      }
      if (query.createdBefore) {
        conditions.push(lt(mediaObjects.created, query.createdBefore));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const selectColumns = buildSelectColumns(options?.fields);

      const baseQuery = selectColumns
        ? db.select(selectColumns).from(mediaObjects)
        : db.select().from(mediaObjects);

      const results = await baseQuery.where(whereClause);
      return selectColumns ? (results as File[]) : results.map(rowToFile);
    },

    deleteMany: async (fileIds: string[]): Promise<number> => {
      if (fileIds.length === 0) return 0;
      const result = await db.delete(mediaObjects).where(inArray(mediaObjects._id, fileIds));
      return result.rowsAffected;
    },

    create: async (doc: Omit<File, '_id' | 'created'> & Pick<Partial<File>, '_id' | 'created'>) => {
      const fileId = doc._id || generateId();
      const now = doc.created || new Date();

      await db.insert(mediaObjects).values({
        _id: fileId,
        path: doc.path,
        name: doc.name,
        size: doc.size,
        type: doc.type,
        url: doc.url,
        expires: doc.expires,
        meta: doc.meta ? JSON.stringify(doc.meta) : null,
        created: now,
      });

      await emit('FILE_CREATE', { fileId });
      return fileId;
    },

    update: async (fileId: string, doc: Partial<File>) => {
      const updateData: Record<string, any> = {
        updated: new Date(),
      };

      if (doc.path !== undefined) updateData.path = doc.path;
      if (doc.name !== undefined) updateData.name = doc.name;
      if (doc.size !== undefined) updateData.size = doc.size;
      if (doc.type !== undefined) updateData.type = doc.type;
      if (doc.url !== undefined) updateData.url = doc.url;
      if (doc.expires !== undefined) updateData.expires = doc.expires;
      if (doc.meta !== undefined) updateData.meta = JSON.stringify(doc.meta);

      await db.update(mediaObjects).set(updateData).where(eq(mediaObjects._id, fileId));

      await emit('FILE_UPDATE', { fileId });
      return fileId;
    },

    unexpire: async (fileId: string) => {
      await db
        .update(mediaObjects)
        .set({
          updated: new Date(),
          expires: null,
        })
        .where(eq(mediaObjects._id, fileId));

      await emit('FILE_UPDATE', { fileId });
      return fileId;
    },

    delete: async (fileId: string) => {
      const result = await db.delete(mediaObjects).where(eq(mediaObjects._id, fileId));
      await emit('FILE_REMOVE', { fileId });
      return result.rowsAffected;
    },

    // Utility method to clean up expired files (should be called periodically)
    cleanupExpiredFiles: async () => {
      const now = new Date();
      const result = await db
        .delete(mediaObjects)
        .where(and(sql`${mediaObjects.expires} IS NOT NULL`, lt(mediaObjects.expires, now)));
      return result.rowsAffected;
    },
  };
};

export type FilesModule = Awaited<ReturnType<typeof configureFilesModule>>;
