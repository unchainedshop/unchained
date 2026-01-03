/**
 * FTS5 Search Query Escaping Utility
 *
 * SQLite FTS5 has special operators that can be exploited for SQL injection:
 * - Boolean operators: AND, OR, NOT, NEAR
 * - Special characters: * " \ ( ) : ^
 *
 * This utility sanitizes user input for safe use in FTS5 MATCH queries.
 *
 * @see https://www.sqlite.org/fts5.html#full_text_query_syntax
 */

/**
 * Escape a search string for safe use in FTS5 MATCH queries.
 *
 * Security approach:
 * 1. Remove all FTS5 special characters that could alter query semantics
 * 2. Remove boolean operators (AND, OR, NOT, NEAR) as whole words
 * 3. Split remaining text into words
 * 4. Wrap each word in double quotes for exact phrase matching
 *
 * @param searchText - Raw user input search string
 * @returns Sanitized FTS5 query string, or empty string if no valid terms
 *
 * @example
 * ```typescript
 * escapeFTS5('hello world')     // '"hello" "world"'
 * escapeFTS5('hello-world')     // '"hello" "world"' (hyphens become spaces)
 * escapeFTS5('test" OR 1=1 --') // '"test" "11"'
 * escapeFTS5('user*')           // '"user"'
 * escapeFTS5('')                // ''
 * ```
 */
export function escapeFTS5(searchText: string): string {
  if (!searchText || typeof searchText !== 'string') {
    return '';
  }

  // Step 1: Remove FTS5 special characters
  // * - prefix/suffix wildcard
  // " - phrase delimiter
  // \ - escape character
  // ( ) - grouping
  // : - column filter
  // ^ - boost operator
  // - - NOT operator / word separator (replaced with space to match tokenization)
  let cleaned = searchText.replace(/[*"\\():^]/g, '').replace(/-/g, ' ');

  // Step 2: Remove boolean operators as whole words (case-insensitive)
  // Using word boundaries to avoid removing "ANDROID" when removing "AND"
  cleaned = cleaned.replace(/\b(AND|OR|NOT|NEAR)\b/gi, ' ');

  // Step 3: Normalize whitespace and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (!cleaned) {
    return '';
  }

  // Step 4: Split into words and wrap each in double quotes
  // This ensures exact matching and prevents any remaining special chars from being interpreted
  const words = cleaned.split(' ').filter((word) => word.length > 0);

  if (words.length === 0) {
    return '';
  }

  // Wrap each word in double quotes for exact phrase matching
  // Double quotes inside words were already removed in step 1
  return words.map((word) => `"${word}"`).join(' ');
}

/**
 * Escape a search string for FTS5 with prefix matching support.
 *
 * Similar to escapeFTS5 but appends * to the last word for prefix matching.
 * Use this when you want "hel" to match "hello", "help", etc.
 *
 * @param searchText - Raw user input search string
 * @returns Sanitized FTS5 query string with prefix matching, or empty string
 *
 * @example
 * ```typescript
 * escapeFTS5WithPrefix('hello wor')  // '"hello" "wor"*'
 * escapeFTS5WithPrefix('test')       // '"test"*'
 * escapeFTS5WithPrefix('')           // ''
 * ```
 */
export function escapeFTS5WithPrefix(searchText: string): string {
  const escaped = escapeFTS5(searchText);

  if (!escaped) {
    return '';
  }

  // Add prefix matching to the last quoted term
  // '"hello" "world"' becomes '"hello" "world"*'
  return escaped.replace(/"$/, '"*');
}
