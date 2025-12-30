// Brand definitions for electronics store

export interface Brand {
  id: string;
  name: string;
  categories: string[];
}

export const brands: Brand[] = [
  // Computer/Laptop brands
  {
    id: 'apple',
    name: 'Apple',
    categories: ['laptops', 'tablets', 'smartphones', 'smartwatches', 'headphones'],
  },
  { id: 'dell', name: 'Dell', categories: ['laptops', 'desktops', 'monitors'] },
  { id: 'hp', name: 'HP', categories: ['laptops', 'desktops', 'printers', 'monitors'] },
  { id: 'lenovo', name: 'Lenovo', categories: ['laptops', 'desktops', 'tablets'] },
  { id: 'asus', name: 'ASUS', categories: ['laptops', 'desktops', 'monitors', 'routers'] },
  { id: 'acer', name: 'Acer', categories: ['laptops', 'desktops', 'monitors'] },
  { id: 'msi', name: 'MSI', categories: ['laptops', 'desktops', 'monitors', 'gaming-accessories'] },

  // Smartphone brands
  {
    id: 'samsung',
    name: 'Samsung',
    categories: ['smartphones', 'tablets', 'smartwatches', 'monitors', 'storage'],
  },
  { id: 'google', name: 'Google', categories: ['smartphones'] },
  { id: 'oneplus', name: 'OnePlus', categories: ['smartphones'] },
  { id: 'xiaomi', name: 'Xiaomi', categories: ['smartphones', 'fitness-trackers'] },

  // Audio brands
  { id: 'sony', name: 'Sony', categories: ['headphones', 'speakers', 'cameras', 'consoles'] },
  { id: 'bose', name: 'Bose', categories: ['headphones', 'speakers', 'home-theater'] },
  { id: 'jbl', name: 'JBL', categories: ['headphones', 'speakers'] },
  { id: 'sennheiser', name: 'Sennheiser', categories: ['headphones'] },
  { id: 'audio-technica', name: 'Audio-Technica', categories: ['headphones'] },

  // Accessory brands
  {
    id: 'logitech',
    name: 'Logitech',
    categories: ['keyboards', 'mice', 'webcams', 'headphones', 'speakers'],
  },
  { id: 'razer', name: 'Razer', categories: ['keyboards', 'mice', 'headphones', 'gaming-accessories'] },
  {
    id: 'corsair',
    name: 'Corsair',
    categories: ['keyboards', 'mice', 'headphones', 'gaming-accessories'],
  },
  {
    id: 'steelseries',
    name: 'SteelSeries',
    categories: ['keyboards', 'mice', 'headphones', 'gaming-accessories'],
  },

  // Wearable brands
  { id: 'garmin', name: 'Garmin', categories: ['smartwatches', 'fitness-trackers'] },
  { id: 'fitbit', name: 'Fitbit', categories: ['fitness-trackers', 'smartwatches'] },

  // Camera brands
  { id: 'canon', name: 'Canon', categories: ['cameras', 'printers'] },
  { id: 'nikon', name: 'Nikon', categories: ['cameras'] },
  { id: 'gopro', name: 'GoPro', categories: ['action-cameras'] },
  { id: 'dji', name: 'DJI', categories: ['action-cameras', 'cameras'] },

  // Gaming brands
  { id: 'nintendo', name: 'Nintendo', categories: ['consoles', 'gaming-accessories'] },
  {
    id: 'microsoft',
    name: 'Microsoft',
    categories: ['consoles', 'gaming-accessories', 'keyboards', 'mice'],
  },

  // Networking/Home Office
  { id: 'netgear', name: 'Netgear', categories: ['routers'] },
  { id: 'tp-link', name: 'TP-Link', categories: ['routers'] },
  { id: 'western-digital', name: 'Western Digital', categories: ['storage'] },
  { id: 'seagate', name: 'Seagate', categories: ['storage'] },
  { id: 'sandisk', name: 'SanDisk', categories: ['storage'] },
  { id: 'brother', name: 'Brother', categories: ['printers'] },
  { id: 'epson', name: 'Epson', categories: ['printers'] },

  // Accessory/Case brands
  { id: 'anker', name: 'Anker', categories: ['chargers', 'cables'] },
  { id: 'belkin', name: 'Belkin', categories: ['chargers', 'cables', 'cases'] },
  { id: 'spigen', name: 'Spigen', categories: ['cases', 'screen-protectors'] },
  { id: 'otterbox', name: 'OtterBox', categories: ['cases'] },
];

export function getBrandsForCategory(category: string): Brand[] {
  return brands.filter((brand) => brand.categories.includes(category));
}
