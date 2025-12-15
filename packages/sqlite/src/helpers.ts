// Re-export utilities from db.ts
export {
  generateId,
  toSnakeCase,
  toSqliteDate,
  fromSqliteDate,
  toSelectOptions,
  type SelectOptions,
  type FindOptions,
} from './db.ts';

// Additional utility functions

export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function toJson(data: any): string | null {
  if (data === undefined || data === null) return null;
  return JSON.stringify(data);
}

export function fromJson<T = any>(jsonStr: string | null | undefined): T | undefined {
  if (!jsonStr) return undefined;
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return undefined;
  }
}
