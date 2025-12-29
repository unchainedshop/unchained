/**
 * Bookmarks Module - Drizzle ORM with SQLite/Turso
 */

import { emit, registerEvents } from '@unchainedshop/events';
import {
  eq,
  and,
  inArray,
  generateId,
  buildSelectColumns,
  type SQL,
  type DrizzleDb,
} from '@unchainedshop/store';
import { bookmarks, type BookmarkRow } from '../db/schema.ts';

export interface Bookmark {
  _id: string;
  userId: string;
  productId: string;
  meta?: unknown;
  created: Date;
  updated?: Date;
}

export interface CreateBookmarkInput {
  _id?: string;
  userId: string;
  productId: string;
  meta?: unknown;
  created?: Date;
}

export interface BookmarkQuery {
  userId?: string;
  productId?: string;
}

export type BookmarkFields = keyof Bookmark;

export interface BookmarkQueryOptions {
  fields?: BookmarkFields[];
}

const COLUMNS = {
  _id: bookmarks._id,
  userId: bookmarks.userId,
  productId: bookmarks.productId,
  meta: bookmarks.meta,
  created: bookmarks.created,
  updated: bookmarks.updated,
} as const;

export const BOOKMARK_EVENTS = ['BOOKMARK_CREATE', 'BOOKMARK_UPDATE', 'BOOKMARK_REMOVE'] as const;

const rowToBookmark = (row: BookmarkRow): Bookmark => ({
  _id: row._id,
  userId: row.userId,
  productId: row.productId,
  meta: row.meta ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
});

export async function configureBookmarksModule({ db }: { db: DrizzleDb }) {
  registerEvents([...BOOKMARK_EVENTS]);

  return {
    // Queries
    findBookmarksByUserId: async (userId: string): Promise<Bookmark[]> => {
      const results = await db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
      return results.map(rowToBookmark);
    },

    findBookmarkById: async (
      bookmarkId: string,
      options?: BookmarkQueryOptions,
    ): Promise<Bookmark | null> => {
      const selectColumns = buildSelectColumns(COLUMNS, options?.fields);
      const baseQuery = selectColumns
        ? db.select(selectColumns).from(bookmarks)
        : db.select().from(bookmarks);
      const [row] = await baseQuery.where(eq(bookmarks._id, bookmarkId)).limit(1);
      return row
        ? selectColumns
          ? (row as unknown as Bookmark)
          : rowToBookmark(row as BookmarkRow)
        : null;
    },

    findBookmarks: async (
      query: BookmarkQuery = {},
      options?: BookmarkQueryOptions,
    ): Promise<Bookmark[]> => {
      const conditions: SQL[] = [];

      if (query.userId) {
        conditions.push(eq(bookmarks.userId, query.userId));
      }
      if (query.productId) {
        conditions.push(eq(bookmarks.productId, query.productId));
      }

      const selectColumns = buildSelectColumns(COLUMNS, options?.fields);
      const baseQuery = selectColumns
        ? db.select(selectColumns).from(bookmarks)
        : db.select().from(bookmarks);

      const results =
        conditions.length > 0 ? await baseQuery.where(and(...conditions)) : await baseQuery;

      return selectColumns
        ? (results as unknown as Bookmark[])
        : results.map((r) => rowToBookmark(r as BookmarkRow));
    },

    // Mutations
    replaceUserId: async (
      fromUserId: string,
      toUserId: string,
      bookmarkIds?: string[],
    ): Promise<number> => {
      const conditions = [eq(bookmarks.userId, fromUserId)];
      if (bookmarkIds?.length) {
        conditions.push(inArray(bookmarks._id, bookmarkIds));
      }

      const result = await db
        .update(bookmarks)
        .set({
          userId: toUserId,
          updated: new Date(),
        })
        .where(and(...conditions));

      return result.rowsAffected;
    },

    deleteByUserId: async (userId: string): Promise<number> => {
      // Get bookmark IDs for event emission
      const bookmarksToDelete = await db
        .select({ _id: bookmarks._id })
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId));

      const result = await db.delete(bookmarks).where(eq(bookmarks.userId, userId));

      // Emit events for each deleted bookmark
      await Promise.all(
        bookmarksToDelete.map(async (b) => emit('BOOKMARK_REMOVE', { bookmarkId: b._id })),
      );

      return result.rowsAffected;
    },

    deleteByProductId: async (productId: string): Promise<number> => {
      // Get bookmark IDs for event emission
      const bookmarksToDelete = await db
        .select({ _id: bookmarks._id })
        .from(bookmarks)
        .where(eq(bookmarks.productId, productId));

      const result = await db.delete(bookmarks).where(eq(bookmarks.productId, productId));

      // Emit events for each deleted bookmark
      await Promise.all(
        bookmarksToDelete.map(async (b) => emit('BOOKMARK_REMOVE', { bookmarkId: b._id })),
      );

      return result.rowsAffected;
    },

    create: async (doc: CreateBookmarkInput): Promise<string> => {
      const bookmarkId = doc._id || generateId();

      await db.insert(bookmarks).values({
        _id: bookmarkId,
        userId: doc.userId,
        productId: doc.productId,
        meta: (doc.meta as Record<string, unknown>) ?? null,
        created: doc.created || new Date(),
      });

      await emit('BOOKMARK_CREATE', { bookmarkId });
      return bookmarkId;
    },

    update: async (bookmarkId: string, doc: Partial<Bookmark>): Promise<string> => {
      const updateData: Record<string, unknown> = {
        updated: new Date(),
      };

      if (doc.userId !== undefined) updateData.userId = doc.userId;
      if (doc.productId !== undefined) updateData.productId = doc.productId;
      if (doc.meta !== undefined) updateData.meta = (doc.meta as Record<string, unknown>) ?? null;

      await db.update(bookmarks).set(updateData).where(eq(bookmarks._id, bookmarkId));

      await emit('BOOKMARK_UPDATE', { bookmarkId });
      return bookmarkId;
    },

    delete: async (bookmarkId: string): Promise<number> => {
      const result = await db.delete(bookmarks).where(eq(bookmarks._id, bookmarkId));
      await emit('BOOKMARK_REMOVE', { bookmarkId });
      return result.rowsAffected;
    },
  };
}

export type BookmarksModule = Awaited<ReturnType<typeof configureBookmarksModule>>;
