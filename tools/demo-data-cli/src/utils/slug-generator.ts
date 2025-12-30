// URL-safe slug generation utilities

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}

export function generateProductSlug(brand: string, model: string, specs?: string): string {
  const parts = [brand, model];
  if (specs) {
    parts.push(specs);
  }
  return generateSlug(parts.join(' '));
}
