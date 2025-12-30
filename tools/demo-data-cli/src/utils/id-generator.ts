// Deterministic ID generation utilities

export function generateProductId(category: string, brand: string, index: number): string {
  const cleanCategory = category.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const cleanBrand = brand.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const paddedIndex = String(index).padStart(4, '0');
  return `product-${cleanCategory}-${cleanBrand}-${paddedIndex}`;
}

export function generateAssortmentId(path: string | string[]): string {
  const pathArray = Array.isArray(path) ? path : [path];
  const cleanPath = pathArray
    .map((p) => p.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
    .join('-');
  return `assortment-${cleanPath}`;
}

export function generateFilterId(key: string): string {
  const cleanKey = key.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return `filter-${cleanKey}`;
}

export function generateSku(category: string, brand: string, index: number, variant?: string): string {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const brandCode = brand.substring(0, 3).toUpperCase();
  const paddedIndex = String(index).padStart(4, '0');
  const variantSuffix = variant ? `-${variant.substring(0, 4).toUpperCase()}` : '';
  return `${categoryCode}-${brandCode}-${paddedIndex}${variantSuffix}`;
}
