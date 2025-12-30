// Assortment generator for bulk import

import type { BulkImportEvent, AssortmentPayload, AssortmentProduct } from '../types/bulk-import.js';
import { categoryTranslations } from '../data/translations.js';
import { generateAssortmentId } from '../utils/id-generator.js';
import { getFilterIds } from './filters.js';
import type { GeneratedProduct } from './products.js';

interface AssortmentNode {
  id: string;
  translationKey: string;
  isRoot?: boolean;
  children?: string[];
  filters?: string[];
}

// Define the expanded category hierarchy for 100+ assortments
const categoryHierarchy: AssortmentNode[] = [
  // Root
  {
    id: 'electronics-store',
    translationKey: 'electronics-store',
    isRoot: true,
    children: [
      'computers-laptops',
      'smartphones-tablets',
      'audio-video',
      'wearables',
      'gaming',
      'home-office',
      'cameras',
      'smart-home',
      'networking',
      'components',
    ],
    filters: getFilterIds(),
  },

  // ========================================
  // Computers & Laptops (20+ subcategories)
  // ========================================
  {
    id: 'computers-laptops',
    translationKey: 'computers-laptops',
    children: ['laptops', 'desktops', 'computer-accessories', 'monitors-displays'],
    filters: getFilterIds(),
  },
  {
    id: 'laptops',
    translationKey: 'laptops',
    children: [
      'gaming-laptops',
      'business-laptops',
      'ultrabooks',
      'workstation-laptops',
      'budget-laptops',
      'student-laptops',
      '2-in-1-laptops',
    ],
    filters: getFilterIds(),
  },
  { id: 'gaming-laptops', translationKey: 'gaming-laptops', filters: getFilterIds() },
  { id: 'business-laptops', translationKey: 'business-laptops', filters: getFilterIds() },
  { id: 'ultrabooks', translationKey: 'ultrabooks', filters: getFilterIds() },
  { id: 'workstation-laptops', translationKey: 'workstation-laptops', filters: getFilterIds() },
  { id: 'budget-laptops', translationKey: 'budget-laptops', filters: getFilterIds() },
  { id: 'student-laptops', translationKey: 'student-laptops', filters: getFilterIds() },
  { id: '2-in-1-laptops', translationKey: '2-in-1-laptops', filters: getFilterIds() },
  {
    id: 'desktops',
    translationKey: 'desktops',
    children: ['gaming-desktops', 'workstation-desktops', 'mini-pcs', 'all-in-ones'],
    filters: getFilterIds(),
  },
  { id: 'gaming-desktops', translationKey: 'gaming-desktops', filters: getFilterIds() },
  { id: 'workstation-desktops', translationKey: 'workstation-desktops', filters: getFilterIds() },
  { id: 'mini-pcs', translationKey: 'mini-pcs', filters: getFilterIds() },
  { id: 'all-in-ones', translationKey: 'all-in-ones', filters: getFilterIds() },
  {
    id: 'computer-accessories',
    translationKey: 'computer-accessories',
    children: [
      'keyboards',
      'mice',
      'webcams',
      'usb-hubs',
      'laptop-stands',
      'docking-stations',
      'laptop-bags',
    ],
    filters: getFilterIds(),
  },
  { id: 'keyboards', translationKey: 'keyboards', filters: getFilterIds() },
  { id: 'mice', translationKey: 'mice', filters: getFilterIds() },
  { id: 'webcams', translationKey: 'webcams', filters: getFilterIds() },
  { id: 'usb-hubs', translationKey: 'usb-hubs', filters: getFilterIds() },
  { id: 'laptop-stands', translationKey: 'laptop-stands', filters: getFilterIds() },
  { id: 'docking-stations', translationKey: 'docking-stations', filters: getFilterIds() },
  { id: 'laptop-bags', translationKey: 'laptop-bags', filters: getFilterIds() },
  {
    id: 'monitors-displays',
    translationKey: 'monitors-displays',
    children: ['gaming-monitors', 'professional-monitors', 'ultrawide-monitors', 'portable-monitors'],
    filters: getFilterIds(),
  },
  { id: 'gaming-monitors', translationKey: 'gaming-monitors', filters: getFilterIds() },
  { id: 'professional-monitors', translationKey: 'professional-monitors', filters: getFilterIds() },
  { id: 'ultrawide-monitors', translationKey: 'ultrawide-monitors', filters: getFilterIds() },
  { id: 'portable-monitors', translationKey: 'portable-monitors', filters: getFilterIds() },

  // ========================================
  // Smartphones & Tablets (15+ subcategories)
  // ========================================
  {
    id: 'smartphones-tablets',
    translationKey: 'smartphones-tablets',
    children: ['smartphones', 'tablets', 'phone-accessories', 'tablet-accessories'],
    filters: getFilterIds(),
  },
  {
    id: 'smartphones',
    translationKey: 'smartphones',
    children: ['android-phones', 'iphones', 'flagship-phones', 'budget-phones', 'rugged-phones'],
    filters: getFilterIds(),
  },
  { id: 'android-phones', translationKey: 'android-phones', filters: getFilterIds() },
  { id: 'iphones', translationKey: 'iphones', filters: getFilterIds() },
  { id: 'flagship-phones', translationKey: 'flagship-phones', filters: getFilterIds() },
  { id: 'budget-phones', translationKey: 'budget-phones', filters: getFilterIds() },
  { id: 'rugged-phones', translationKey: 'rugged-phones', filters: getFilterIds() },
  {
    id: 'tablets',
    translationKey: 'tablets',
    children: ['android-tablets', 'ipads', 'e-readers', 'kids-tablets'],
    filters: getFilterIds(),
  },
  { id: 'android-tablets', translationKey: 'android-tablets', filters: getFilterIds() },
  { id: 'ipads', translationKey: 'ipads', filters: getFilterIds() },
  { id: 'e-readers', translationKey: 'e-readers', filters: getFilterIds() },
  { id: 'kids-tablets', translationKey: 'kids-tablets', filters: getFilterIds() },
  {
    id: 'phone-accessories',
    translationKey: 'phone-accessories',
    children: ['cases', 'chargers', 'screen-protectors', 'power-banks', 'phone-mounts'],
    filters: getFilterIds(),
  },
  { id: 'cases', translationKey: 'cases', filters: getFilterIds() },
  { id: 'chargers', translationKey: 'chargers', filters: getFilterIds() },
  { id: 'screen-protectors', translationKey: 'screen-protectors', filters: getFilterIds() },
  { id: 'power-banks', translationKey: 'power-banks', filters: getFilterIds() },
  { id: 'phone-mounts', translationKey: 'phone-mounts', filters: getFilterIds() },
  {
    id: 'tablet-accessories',
    translationKey: 'tablet-accessories',
    children: ['tablet-cases', 'stylus-pens', 'tablet-keyboards'],
    filters: getFilterIds(),
  },
  { id: 'tablet-cases', translationKey: 'tablet-cases', filters: getFilterIds() },
  { id: 'stylus-pens', translationKey: 'stylus-pens', filters: getFilterIds() },
  { id: 'tablet-keyboards', translationKey: 'tablet-keyboards', filters: getFilterIds() },

  // ========================================
  // Audio & Video (15+ subcategories)
  // ========================================
  {
    id: 'audio-video',
    translationKey: 'audio-video',
    children: ['headphones', 'speakers', 'home-theater', 'microphones', 'turntables'],
    filters: getFilterIds(),
  },
  {
    id: 'headphones',
    translationKey: 'headphones',
    children: [
      'wireless-headphones',
      'wired-headphones',
      'gaming-headsets',
      'noise-cancelling',
      'earbuds',
      'sports-headphones',
    ],
    filters: getFilterIds(),
  },
  { id: 'wireless-headphones', translationKey: 'wireless-headphones', filters: getFilterIds() },
  { id: 'wired-headphones', translationKey: 'wired-headphones', filters: getFilterIds() },
  { id: 'gaming-headsets', translationKey: 'gaming-headsets', filters: getFilterIds() },
  { id: 'noise-cancelling', translationKey: 'noise-cancelling', filters: getFilterIds() },
  { id: 'earbuds', translationKey: 'earbuds', filters: getFilterIds() },
  { id: 'sports-headphones', translationKey: 'sports-headphones', filters: getFilterIds() },
  {
    id: 'speakers',
    translationKey: 'speakers',
    children: ['bluetooth-speakers', 'smart-speakers', 'soundbars', 'portable-speakers', 'party-speakers'],
    filters: getFilterIds(),
  },
  { id: 'bluetooth-speakers', translationKey: 'bluetooth-speakers', filters: getFilterIds() },
  { id: 'smart-speakers', translationKey: 'smart-speakers', filters: getFilterIds() },
  { id: 'soundbars', translationKey: 'soundbars', filters: getFilterIds() },
  { id: 'portable-speakers', translationKey: 'portable-speakers', filters: getFilterIds() },
  { id: 'party-speakers', translationKey: 'party-speakers', filters: getFilterIds() },
  { id: 'home-theater', translationKey: 'home-theater', filters: getFilterIds() },
  { id: 'microphones', translationKey: 'microphones', filters: getFilterIds() },
  { id: 'turntables', translationKey: 'turntables', filters: getFilterIds() },

  // ========================================
  // Wearables (8+ subcategories)
  // ========================================
  {
    id: 'wearables',
    translationKey: 'wearables',
    children: ['smartwatches', 'fitness-trackers', 'smart-rings', 'smart-glasses'],
    filters: getFilterIds(),
  },
  {
    id: 'smartwatches',
    translationKey: 'smartwatches',
    children: ['apple-watch', 'android-watches', 'hybrid-watches'],
    filters: getFilterIds(),
  },
  { id: 'apple-watch', translationKey: 'apple-watch', filters: getFilterIds() },
  { id: 'android-watches', translationKey: 'android-watches', filters: getFilterIds() },
  { id: 'hybrid-watches', translationKey: 'hybrid-watches', filters: getFilterIds() },
  { id: 'fitness-trackers', translationKey: 'fitness-trackers', filters: getFilterIds() },
  { id: 'smart-rings', translationKey: 'smart-rings', filters: getFilterIds() },
  { id: 'smart-glasses', translationKey: 'smart-glasses', filters: getFilterIds() },

  // ========================================
  // Gaming (12+ subcategories)
  // ========================================
  {
    id: 'gaming',
    translationKey: 'gaming',
    children: ['consoles', 'gaming-accessories', 'gaming-furniture', 'vr-gaming'],
    filters: getFilterIds(),
  },
  {
    id: 'consoles',
    translationKey: 'consoles',
    children: ['playstation', 'xbox', 'nintendo', 'handheld-consoles'],
    filters: getFilterIds(),
  },
  { id: 'playstation', translationKey: 'playstation', filters: getFilterIds() },
  { id: 'xbox', translationKey: 'xbox', filters: getFilterIds() },
  { id: 'nintendo', translationKey: 'nintendo', filters: getFilterIds() },
  { id: 'handheld-consoles', translationKey: 'handheld-consoles', filters: getFilterIds() },
  {
    id: 'gaming-accessories',
    translationKey: 'gaming-accessories',
    children: ['controllers', 'gaming-mice', 'gaming-keyboards', 'gaming-chairs'],
    filters: getFilterIds(),
  },
  { id: 'controllers', translationKey: 'controllers', filters: getFilterIds() },
  { id: 'gaming-mice', translationKey: 'gaming-mice', filters: getFilterIds() },
  { id: 'gaming-keyboards', translationKey: 'gaming-keyboards', filters: getFilterIds() },
  { id: 'gaming-chairs', translationKey: 'gaming-chairs', filters: getFilterIds() },
  { id: 'gaming-furniture', translationKey: 'gaming-furniture', filters: getFilterIds() },
  { id: 'vr-gaming', translationKey: 'vr-gaming', filters: getFilterIds() },

  // ========================================
  // Home Office (10+ subcategories)
  // ========================================
  {
    id: 'home-office',
    translationKey: 'home-office',
    children: ['printers', 'routers', 'storage', 'office-accessories', 'presentation'],
    filters: getFilterIds(),
  },
  {
    id: 'printers',
    translationKey: 'printers',
    children: ['inkjet-printers', 'laser-printers', 'photo-printers', 'label-printers'],
    filters: getFilterIds(),
  },
  { id: 'inkjet-printers', translationKey: 'inkjet-printers', filters: getFilterIds() },
  { id: 'laser-printers', translationKey: 'laser-printers', filters: getFilterIds() },
  { id: 'photo-printers', translationKey: 'photo-printers', filters: getFilterIds() },
  { id: 'label-printers', translationKey: 'label-printers', filters: getFilterIds() },
  { id: 'routers', translationKey: 'routers', filters: getFilterIds() },
  {
    id: 'storage',
    translationKey: 'storage',
    children: ['external-drives', 'usb-drives', 'memory-cards', 'nas-systems'],
    filters: getFilterIds(),
  },
  { id: 'external-drives', translationKey: 'external-drives', filters: getFilterIds() },
  { id: 'usb-drives', translationKey: 'usb-drives', filters: getFilterIds() },
  { id: 'memory-cards', translationKey: 'memory-cards', filters: getFilterIds() },
  { id: 'nas-systems', translationKey: 'nas-systems', filters: getFilterIds() },
  { id: 'office-accessories', translationKey: 'office-accessories', filters: getFilterIds() },
  { id: 'presentation', translationKey: 'presentation', filters: getFilterIds() },

  // ========================================
  // Cameras (10+ subcategories)
  // ========================================
  {
    id: 'cameras',
    translationKey: 'cameras',
    children: ['digital-cameras', 'action-cameras', 'camera-accessories', 'drones', 'security-cameras'],
    filters: getFilterIds(),
  },
  {
    id: 'digital-cameras',
    translationKey: 'digital-cameras',
    children: ['dslr-cameras', 'mirrorless-cameras', 'compact-cameras', 'instant-cameras'],
    filters: getFilterIds(),
  },
  { id: 'dslr-cameras', translationKey: 'dslr-cameras', filters: getFilterIds() },
  { id: 'mirrorless-cameras', translationKey: 'mirrorless-cameras', filters: getFilterIds() },
  { id: 'compact-cameras', translationKey: 'compact-cameras', filters: getFilterIds() },
  { id: 'instant-cameras', translationKey: 'instant-cameras', filters: getFilterIds() },
  { id: 'action-cameras', translationKey: 'action-cameras', filters: getFilterIds() },
  {
    id: 'camera-accessories',
    translationKey: 'camera-accessories',
    children: ['camera-lenses', 'tripods', 'camera-bags', 'filters-accessories'],
    filters: getFilterIds(),
  },
  { id: 'camera-lenses', translationKey: 'camera-lenses', filters: getFilterIds() },
  { id: 'tripods', translationKey: 'tripods', filters: getFilterIds() },
  { id: 'camera-bags', translationKey: 'camera-bags', filters: getFilterIds() },
  { id: 'filters-accessories', translationKey: 'filters-accessories', filters: getFilterIds() },
  { id: 'drones', translationKey: 'drones', filters: getFilterIds() },
  { id: 'security-cameras', translationKey: 'security-cameras', filters: getFilterIds() },

  // ========================================
  // Smart Home (8+ subcategories)
  // ========================================
  {
    id: 'smart-home',
    translationKey: 'smart-home',
    children: ['smart-lighting', 'smart-security', 'smart-thermostats', 'smart-plugs', 'voice-assistants'],
    filters: getFilterIds(),
  },
  { id: 'smart-lighting', translationKey: 'smart-lighting', filters: getFilterIds() },
  { id: 'smart-security', translationKey: 'smart-security', filters: getFilterIds() },
  { id: 'smart-thermostats', translationKey: 'smart-thermostats', filters: getFilterIds() },
  { id: 'smart-plugs', translationKey: 'smart-plugs', filters: getFilterIds() },
  { id: 'voice-assistants', translationKey: 'voice-assistants', filters: getFilterIds() },

  // ========================================
  // Networking (6+ subcategories)
  // ========================================
  {
    id: 'networking',
    translationKey: 'networking',
    children: ['wifi-routers', 'mesh-systems', 'network-switches', 'network-cables', 'access-points'],
    filters: getFilterIds(),
  },
  { id: 'wifi-routers', translationKey: 'wifi-routers', filters: getFilterIds() },
  { id: 'mesh-systems', translationKey: 'mesh-systems', filters: getFilterIds() },
  { id: 'network-switches', translationKey: 'network-switches', filters: getFilterIds() },
  { id: 'network-cables', translationKey: 'network-cables', filters: getFilterIds() },
  { id: 'access-points', translationKey: 'access-points', filters: getFilterIds() },

  // ========================================
  // Components (6+ subcategories)
  // ========================================
  {
    id: 'components',
    translationKey: 'components',
    children: ['graphics-cards', 'processors', 'ram-memory', 'ssds', 'power-supplies', 'cooling'],
    filters: getFilterIds(),
  },
  { id: 'graphics-cards', translationKey: 'graphics-cards', filters: getFilterIds() },
  { id: 'processors', translationKey: 'processors', filters: getFilterIds() },
  { id: 'ram-memory', translationKey: 'ram-memory', filters: getFilterIds() },
  { id: 'ssds', translationKey: 'ssds', filters: getFilterIds() },
  { id: 'power-supplies', translationKey: 'power-supplies', filters: getFilterIds() },
  { id: 'cooling', translationKey: 'cooling', filters: getFilterIds() },
];

// Build product-to-assortment mapping
function buildProductAssortmentMap(products: GeneratedProduct[]): Map<string, AssortmentProduct[]> {
  const map = new Map<string, AssortmentProduct[]>();

  for (const product of products) {
    const assortmentId = product.assortmentId;

    if (!map.has(assortmentId)) {
      map.set(assortmentId, []);
    }

    const existingProducts = map.get(assortmentId)!;
    existingProducts.push({
      productId: product.event.payload._id,
      sortKey: existingProducts.length,
      tags: [],
    });
  }

  return map;
}

// Sort assortments by hierarchy depth (parents before children)
function sortByHierarchyDepth(nodes: AssortmentNode[]): AssortmentNode[] {
  const depths = new Map<string, number>();
  const nodeMap = new Map<string, AssortmentNode>();

  // Build node map
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Calculate depths
  function getDepth(id: string, visited = new Set<string>()): number {
    if (depths.has(id)) return depths.get(id)!;
    if (visited.has(id)) return 0; // Circular reference protection

    visited.add(id);

    // Find parent
    let parentDepth = -1;
    for (const node of nodes) {
      if (node.children?.includes(id)) {
        parentDepth = Math.max(parentDepth, getDepth(node.id, visited));
      }
    }

    const depth = parentDepth + 1;
    depths.set(id, depth);
    return depth;
  }

  for (const node of nodes) {
    getDepth(node.id);
  }

  // Sort by depth (ascending - roots first)
  return [...nodes].sort((a, b) => (depths.get(a.id) ?? 0) - (depths.get(b.id) ?? 0));
}

export function generateAssortments(
  products: GeneratedProduct[]
): BulkImportEvent<AssortmentPayload>[] {
  const events: BulkImportEvent<AssortmentPayload>[] = [];
  const productMap = buildProductAssortmentMap(products);

  // Sort nodes so parents come before children
  const sortedNodes = sortByHierarchyDepth(categoryHierarchy);

  for (let i = 0; i < sortedNodes.length; i++) {
    const node = sortedNodes[i];
    const translations = categoryTranslations[node.translationKey];

    if (!translations) {
      console.warn(`Missing translations for assortment: ${node.translationKey}`);
      continue;
    }

    const payload: AssortmentPayload = {
      _id: generateAssortmentId(node.id),
      specification: {
        isActive: true,
        isRoot: node.isRoot ?? false,
        sequence: i,
        tags: [node.id],
        content: {
          en: {
            title: translations.en.title,
            slug: translations.en.slug,
            description: translations.en.description,
          },
          de: {
            title: translations.de.title,
            slug: translations.de.slug,
            description: translations.de.description,
          },
          fr: {
            title: translations.fr.title,
            slug: translations.fr.slug,
            description: translations.fr.description,
          },
        },
      },
    };

    // Add children
    if (node.children && node.children.length > 0) {
      payload.children = node.children.map((childId, index) => ({
        assortmentId: generateAssortmentId(childId),
        sortKey: index,
        tags: [],
      }));
    }

    // Add products
    const assortmentProducts = productMap.get(node.id);
    if (assortmentProducts && assortmentProducts.length > 0) {
      payload.products = assortmentProducts;
    }

    // Add filters
    if (node.filters && node.filters.length > 0) {
      payload.filters = node.filters.map((filterId, index) => ({
        filterId,
        sortKey: index,
        tags: [],
      }));
    }

    events.push({
      entity: 'ASSORTMENT',
      operation: 'CREATE',
      payload,
    });
  }

  return events;
}

export function getAssortmentCount(): number {
  return categoryHierarchy.length;
}
