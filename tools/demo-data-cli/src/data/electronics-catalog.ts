// Electronics catalog with product templates for each category

export interface ProductTemplate {
  category: string;
  subcategory?: string;
  assortmentId: string;
  baseTitle: { en: string; de: string; fr: string };
  baseDescription: { en: string; de: string; fr: string };
  brands: string[];
  priceRange: { min: number; max: number };
  weightRange: { min: number; max: number };
  variations: ProductVariation[];
  tags: string[];
  isWireless?: boolean;
  screenSizes?: string[];
  memoryOptions?: string[];
  colorOptions?: string[];
  connectivityOptions?: string[];
}

export interface ProductVariation {
  key: string;
  values: (string | number | boolean)[];
}

// Helper to generate product descriptions
export function generateDescription(
  template: ProductTemplate,
  brand: string,
  specs: Record<string, string | number | boolean>,
  locale: 'en' | 'de' | 'fr',
): string {
  const descriptions: Record<string, Record<'en' | 'de' | 'fr', string>> = {
    laptops: {
      en: `Experience exceptional computing power with the ${brand} laptop. Featuring ${specs.processor || 'powerful'} processing, ${specs.memory || '16'}GB RAM, and a stunning ${specs.screenSize || '15.6'}" display, this laptop delivers outstanding performance for both work and entertainment.

Key Features:
- High-performance processor for demanding tasks
- ${specs.memory || '16'}GB RAM for seamless multitasking
- ${specs.storage || '512'}GB SSD for fast boot times
- ${specs.screenSize || '15.6'}" Full HD display
- Long-lasting battery life
- Premium build quality

Perfect for professionals, students, and creators who demand reliability and performance.`,

      de: `Erleben Sie aussergewoehnliche Rechenleistung mit dem ${brand} Laptop. Ausgestattet mit ${specs.processor || 'leistungsstarkem'} Prozessor, ${specs.memory || '16'}GB RAM und einem beeindruckenden ${specs.screenSize || '15.6'}" Display liefert dieser Laptop hervorragende Leistung fuer Arbeit und Unterhaltung.

Hauptmerkmale:
- Hochleistungsprozessor fuer anspruchsvolle Aufgaben
- ${specs.memory || '16'}GB RAM fuer nahtloses Multitasking
- ${specs.storage || '512'}GB SSD fuer schnelle Startzeiten
- ${specs.screenSize || '15.6'}" Full HD Display
- Langlebige Akkulaufzeit
- Premium Verarbeitungsqualitaet

Perfekt fuer Profis, Studenten und Kreative, die Zuverlaessigkeit und Leistung verlangen.`,

      fr: `Decouvrez une puissance informatique exceptionnelle avec le portable ${brand}. Equipe d'un processeur ${specs.processor || 'puissant'}, de ${specs.memory || '16'}Go de RAM et d'un superbe ecran de ${specs.screenSize || '15.6'}", ce portable offre des performances remarquables pour le travail et le divertissement.

Caracteristiques principales:
- Processeur haute performance pour les taches exigeantes
- ${specs.memory || '16'}Go de RAM pour un multitache fluide
- SSD ${specs.storage || '512'}Go pour un demarrage rapide
- Ecran Full HD de ${specs.screenSize || '15.6'}"
- Autonomie longue duree
- Qualite de fabrication premium

Parfait pour les professionnels, etudiants et createurs qui exigent fiabilite et performance.`,
    },

    smartphones: {
      en: `Stay connected with the ${brand} smartphone. Featuring a vibrant ${specs.screenSize || '6.5'}" display, ${specs.storage || '128'}GB storage, and an advanced camera system, this device keeps you productive and entertained.

Key Features:
- Stunning ${specs.screenSize || '6.5'}" AMOLED display
- ${specs.storage || '128'}GB internal storage
- Pro-grade camera system
- 5G connectivity
- All-day battery life
- Fast wireless charging

The perfect companion for modern life.`,

      de: `Bleiben Sie verbunden mit dem ${brand} Smartphone. Mit einem lebendigen ${specs.screenSize || '6.5'}" Display, ${specs.storage || '128'}GB Speicher und einem fortschrittlichen Kamerasystem haelt Sie dieses Geraet produktiv und unterhalten.

Hauptmerkmale:
- Atemberaubendes ${specs.screenSize || '6.5'}" AMOLED Display
- ${specs.storage || '128'}GB interner Speicher
- Professionelles Kamerasystem
- 5G Konnektivitaet
- Ganztaegige Akkulaufzeit
- Schnelles kabelloses Laden

Der perfekte Begleiter fuer das moderne Leben.`,

      fr: `Restez connecte avec le smartphone ${brand}. Avec son ecran vibrant de ${specs.screenSize || '6.5'}", ${specs.storage || '128'}Go de stockage et un systeme photo avance, cet appareil vous garde productif et diverti.

Caracteristiques principales:
- Superbe ecran AMOLED ${specs.screenSize || '6.5'}"
- Stockage interne ${specs.storage || '128'}Go
- Systeme photo professionnel
- Connectivite 5G
- Autonomie toute la journee
- Charge sans fil rapide

Le compagnon parfait pour la vie moderne.`,
    },

    headphones: {
      en: `Immerse yourself in pure audio with ${brand} headphones. Experience crystal-clear sound, exceptional comfort, and premium features that elevate your listening experience.

Key Features:
- Premium audio drivers for rich, detailed sound
- Active noise cancellation
- ${specs.wireless ? 'Wireless Bluetooth connectivity' : 'High-quality wired connection'}
- Comfortable ear cushions for extended wear
- ${specs.batteryLife || '30'}+ hours of playback
- Built-in microphone for calls

Perfect for music lovers, commuters, and professionals.`,

      de: `Tauchen Sie ein in reinen Klang mit ${brand} Kopfhoerern. Erleben Sie kristallklaren Sound, aussergewoehnlichen Komfort und Premium-Funktionen, die Ihr Hoererlebnis verbessern.

Hauptmerkmale:
- Premium Audiotreiber fuer satten, detaillierten Klang
- Aktive Geraeuschunterdrueckung
- ${specs.wireless ? 'Kabellose Bluetooth-Verbindung' : 'Hochwertige Kabelverbindung'}
- Bequeme Ohrpolster fuer langes Tragen
- ${specs.batteryLife || '30'}+ Stunden Wiedergabe
- Eingebautes Mikrofon fuer Anrufe

Perfekt fuer Musikliebhaber, Pendler und Profis.`,

      fr: `Plongez dans un audio pur avec les casques ${brand}. Decouvrez un son cristallin, un confort exceptionnel et des fonctionnalites premium qui elevent votre experience d'ecoute.

Caracteristiques principales:
- Haut-parleurs premium pour un son riche et detaille
- Reduction active du bruit
- ${specs.wireless ? 'Connectivite Bluetooth sans fil' : 'Connexion filaire haute qualite'}
- Coussinets confortables pour un port prolonge
- ${specs.batteryLife || '30'}+ heures de lecture
- Microphone integre pour les appels

Parfait pour les melomanes, les navetteurs et les professionnels.`,
    },

    tablets: {
      en: `The ${brand} tablet combines power and portability. With its stunning ${specs.screenSize || '10.9'}" display and ${specs.storage || '64'}GB storage, it's perfect for work, creativity, and entertainment on the go.

Key Features:
- Brilliant ${specs.screenSize || '10.9'}" Retina display
- ${specs.storage || '64'}GB storage capacity
- Powerful processor for demanding apps
- All-day battery life
- Optional keyboard and stylus support
- Lightweight and portable design

Your perfect companion for productivity and creativity.`,

      de: `Das ${brand} Tablet kombiniert Leistung und Tragbarkeit. Mit seinem beeindruckenden ${specs.screenSize || '10.9'}" Display und ${specs.storage || '64'}GB Speicher ist es perfekt fuer Arbeit, Kreativitaet und Unterhaltung unterwegs.

Hauptmerkmale:
- Brillantes ${specs.screenSize || '10.9'}" Retina Display
- ${specs.storage || '64'}GB Speicherkapazitaet
- Leistungsstarker Prozessor fuer anspruchsvolle Apps
- Ganztaegige Akkulaufzeit
- Optionale Tastatur- und Stiftunterstuetzung
- Leichtes und tragbares Design

Ihr perfekter Begleiter fuer Produktivitaet und Kreativitaet.`,

      fr: `La tablette ${brand} allie puissance et portabilite. Avec son superbe ecran de ${specs.screenSize || '10.9'}" et ${specs.storage || '64'}Go de stockage, elle est parfaite pour le travail, la creativite et le divertissement en deplacement.

Caracteristiques principales:
- Ecran Retina ${specs.screenSize || '10.9'}" brillant
- Capacite de stockage ${specs.storage || '64'}Go
- Processeur puissant pour les applications exigeantes
- Autonomie toute la journee
- Support clavier et stylet en option
- Design leger et portable

Votre compagnon parfait pour la productivite et la creativite.`,
    },

    default: {
      en: `Discover the ${brand} product designed to enhance your daily life. Quality craftsmanship and innovative features for an exceptional experience.

Key Features:
- Premium build quality
- Advanced technology
- User-friendly design
- Reliable performance
- Industry-leading warranty

Experience the difference.`,

      de: `Entdecken Sie das ${brand} Produkt, das Ihr taegliches Leben bereichert. Hochwertige Verarbeitung und innovative Funktionen fuer ein aussergewoehnliches Erlebnis.

Hauptmerkmale:
- Premium Verarbeitungsqualitaet
- Fortschrittliche Technologie
- Benutzerfreundliches Design
- Zuverlaessige Leistung
- Branchenfuehrende Garantie

Erleben Sie den Unterschied.`,

      fr: `Decouvrez le produit ${brand} concu pour ameliorer votre quotidien. Fabrication de qualite et fonctionnalites innovantes pour une experience exceptionnelle.

Caracteristiques principales:
- Qualite de fabrication premium
- Technologie avancee
- Design convivial
- Performance fiable
- Garantie leader du secteur

Vivez la difference.`,
    },
  };

  const categoryTemplate = descriptions[template.category] || descriptions.default;
  return categoryTemplate[locale];
}

// Expanded product templates for 10,000+ products
export const productTemplates: ProductTemplate[] = [
  // ==================== LAPTOPS (expanded) ====================
  {
    category: 'laptops',
    subcategory: 'gaming-laptops',
    assortmentId: 'gaming-laptops',
    baseTitle: { en: 'Gaming Laptop', de: 'Gaming Laptop', fr: 'Portable Gaming' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['asus', 'msi', 'razer', 'lenovo', 'dell', 'hp', 'acer'],
    priceRange: { min: 99900, max: 349900 },
    weightRange: { min: 2000, max: 3500 },
    variations: [
      { key: 'screenSize', values: [15, 16, 17, 18] },
      { key: 'memory', values: [16, 32, 64] },
      {
        key: 'processor',
        values: ['i7-13700H', 'i9-13900H', 'i7-14700H', 'i9-14900H', 'Ryzen7-7840HS', 'Ryzen9-7945HX'],
      },
      { key: 'gpu', values: ['RTX4060', 'RTX4070', 'RTX4080', 'RTX4090'] },
      { key: 'storage', values: [512, 1000, 2000] },
    ],
    tags: ['gaming', 'laptop', 'high-performance'],
    screenSizes: ['15-17', 'over-17'],
    memoryOptions: ['16gb', '32gb', '64gb'],
    colorOptions: ['black', 'silver'],
  },
  {
    category: 'laptops',
    subcategory: 'business-laptops',
    assortmentId: 'business-laptops',
    baseTitle: { en: 'Business Laptop', de: 'Business Laptop', fr: 'Portable Professionnel' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['dell', 'lenovo', 'hp', 'apple', 'microsoft'],
    priceRange: { min: 89900, max: 249900 },
    weightRange: { min: 1200, max: 2000 },
    variations: [
      { key: 'screenSize', values: [13, 14, 15, 16] },
      { key: 'memory', values: [8, 16, 32, 64] },
      { key: 'processor', values: ['i5-1340P', 'i7-1360P', 'i7-1370P', 'M2', 'M3', 'M3-Pro'] },
      { key: 'storage', values: [256, 512, 1000, 2000] },
    ],
    tags: ['business', 'laptop', 'professional'],
    screenSizes: ['10-15', '15-17'],
    memoryOptions: ['8gb', '16gb', '32gb', '64gb'],
    colorOptions: ['black', 'silver', 'gold'],
  },
  {
    category: 'laptops',
    subcategory: 'ultrabooks',
    assortmentId: 'ultrabooks',
    baseTitle: { en: 'Ultrabook', de: 'Ultrabook', fr: 'Ultrabook' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['apple', 'dell', 'hp', 'lenovo', 'asus', 'lg'],
    priceRange: { min: 99900, max: 299900 },
    weightRange: { min: 900, max: 1500 },
    variations: [
      { key: 'screenSize', values: [13, 14, 15] },
      { key: 'memory', values: [8, 16, 24, 32] },
      {
        key: 'processor',
        values: ['i5-1340P', 'i7-1360P', 'M2-Air', 'M3-Air', 'Ryzen5-7640U', 'Ryzen7-7840U'],
      },
      { key: 'storage', values: [256, 512, 1000] },
      { key: 'color', values: ['silver', 'gold', 'black', 'blue'] },
    ],
    tags: ['ultrabook', 'laptop', 'portable', 'lightweight'],
    screenSizes: ['10-15'],
    memoryOptions: ['8gb', '16gb', '24gb', '32gb'],
    colorOptions: ['silver', 'gold', 'black', 'blue'],
  },
  {
    category: 'laptops',
    subcategory: 'workstation-laptops',
    assortmentId: 'workstation-laptops',
    baseTitle: { en: 'Mobile Workstation', de: 'Mobile Workstation', fr: 'Station de Travail Mobile' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['dell', 'hp', 'lenovo', 'apple'],
    priceRange: { min: 199900, max: 599900 },
    weightRange: { min: 2000, max: 3500 },
    variations: [
      { key: 'screenSize', values: [15, 16, 17] },
      { key: 'memory', values: [32, 64, 128] },
      { key: 'processor', values: ['i9-13950HX', 'Xeon-W', 'M3-Max', 'M3-Ultra'] },
      { key: 'gpu', values: ['RTX-A2000', 'RTX-A3000', 'RTX-A4500', 'RTX-A5000'] },
      { key: 'storage', values: [1000, 2000, 4000] },
    ],
    tags: ['workstation', 'laptop', 'professional', 'cad', '3d'],
    screenSizes: ['15-17', 'over-17'],
    memoryOptions: ['32gb', '64gb'],
    colorOptions: ['black', 'silver'],
  },
  {
    category: 'laptops',
    subcategory: 'chromebooks',
    assortmentId: 'chromebooks',
    baseTitle: { en: 'Chromebook', de: 'Chromebook', fr: 'Chromebook' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['acer', 'asus', 'hp', 'lenovo', 'samsung'],
    priceRange: { min: 24900, max: 79900 },
    weightRange: { min: 1000, max: 1800 },
    variations: [
      { key: 'screenSize', values: [11, 13, 14, 15] },
      { key: 'memory', values: [4, 8] },
      { key: 'storage', values: [32, 64, 128] },
      { key: 'color', values: ['silver', 'white', 'blue'] },
    ],
    tags: ['chromebook', 'laptop', 'education', 'cloud'],
    screenSizes: ['10-15'],
    memoryOptions: ['4gb', '8gb'],
    colorOptions: ['silver', 'white', 'blue'],
  },
  {
    category: 'laptops',
    subcategory: '2in1-laptops',
    assortmentId: '2in1-laptops',
    baseTitle: { en: '2-in-1 Convertible', de: '2-in-1 Convertible', fr: 'Convertible 2-en-1' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['lenovo', 'hp', 'dell', 'microsoft', 'asus'],
    priceRange: { min: 79900, max: 229900 },
    weightRange: { min: 1000, max: 1800 },
    variations: [
      { key: 'screenSize', values: [13, 14, 15] },
      { key: 'memory', values: [8, 16, 32] },
      { key: 'processor', values: ['i5-1340P', 'i7-1360P', 'Ryzen5-7640U', 'Ryzen7-7840U'] },
      { key: 'storage', values: [256, 512, 1000] },
    ],
    tags: ['2in1', 'convertible', 'laptop', 'touchscreen'],
    screenSizes: ['10-15'],
    memoryOptions: ['8gb', '16gb', '32gb'],
    colorOptions: ['silver', 'black', 'blue'],
  },

  // ==================== SMARTPHONES (expanded) ====================
  {
    category: 'smartphones',
    subcategory: 'android-phones',
    assortmentId: 'android-phones',
    baseTitle: { en: 'Android Smartphone', de: 'Android Smartphone', fr: 'Smartphone Android' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['samsung', 'google', 'oneplus', 'xiaomi', 'oppo', 'motorola'],
    priceRange: { min: 29900, max: 149900 },
    weightRange: { min: 150, max: 220 },
    variations: [
      { key: 'storage', values: [128, 256, 512, 1000] },
      { key: 'color', values: ['black', 'white', 'blue', 'green', 'purple', 'red'] },
      { key: 'model', values: ['Standard', 'Pro', 'Ultra', 'Plus', 'Lite'] },
    ],
    tags: ['smartphone', 'android', '5g'],
    screenSizes: ['6-10'],
    memoryOptions: ['128gb', '256gb', '512gb', '1tb'],
    colorOptions: ['black', 'white', 'blue', 'green', 'purple', 'red'],
  },
  {
    category: 'smartphones',
    subcategory: 'iphones',
    assortmentId: 'iphones',
    baseTitle: { en: 'iPhone', de: 'iPhone', fr: 'iPhone' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['apple'],
    priceRange: { min: 79900, max: 199900 },
    weightRange: { min: 170, max: 240 },
    variations: [
      { key: 'storage', values: [128, 256, 512, 1000] },
      { key: 'color', values: ['black', 'white', 'blue', 'gold', 'pink', 'purple', 'green', 'yellow'] },
      {
        key: 'model',
        values: ['15', '15 Plus', '15 Pro', '15 Pro Max', '16', '16 Plus', '16 Pro', '16 Pro Max'],
      },
    ],
    tags: ['smartphone', 'iphone', 'ios', '5g'],
    screenSizes: ['6-10'],
    memoryOptions: ['128gb', '256gb', '512gb', '1tb'],
    colorOptions: ['black', 'white', 'blue', 'gold', 'pink', 'purple', 'green', 'yellow'],
  },
  {
    category: 'smartphones',
    subcategory: 'budget-phones',
    assortmentId: 'budget-phones',
    baseTitle: { en: 'Budget Smartphone', de: 'Budget Smartphone', fr: 'Smartphone Budget' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['xiaomi', 'motorola', 'samsung', 'nokia', 'realme'],
    priceRange: { min: 9900, max: 29900 },
    weightRange: { min: 160, max: 200 },
    variations: [
      { key: 'storage', values: [32, 64, 128] },
      { key: 'color', values: ['black', 'blue', 'green'] },
      { key: 'ram', values: [3, 4, 6] },
    ],
    tags: ['smartphone', 'budget', 'affordable'],
    screenSizes: ['6-10'],
    memoryOptions: ['32gb', '64gb', '128gb'],
    colorOptions: ['black', 'blue', 'green'],
  },
  {
    category: 'smartphones',
    subcategory: 'foldable-phones',
    assortmentId: 'foldable-phones',
    baseTitle: { en: 'Foldable Phone', de: 'Faltbares Smartphone', fr: 'Smartphone Pliable' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['samsung', 'google', 'motorola', 'oppo'],
    priceRange: { min: 99900, max: 199900 },
    weightRange: { min: 180, max: 280 },
    variations: [
      { key: 'storage', values: [256, 512, 1000] },
      { key: 'color', values: ['black', 'white', 'blue', 'gold'] },
      { key: 'type', values: ['Flip', 'Fold'] },
    ],
    tags: ['smartphone', 'foldable', 'premium', '5g'],
    screenSizes: ['6-10'],
    memoryOptions: ['256gb', '512gb', '1tb'],
    colorOptions: ['black', 'white', 'blue', 'gold'],
  },

  // ==================== TABLETS (expanded) ====================
  {
    category: 'tablets',
    subcategory: 'pro-tablets',
    assortmentId: 'pro-tablets',
    baseTitle: { en: 'Pro Tablet', de: 'Pro Tablet', fr: 'Tablette Pro' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['apple', 'samsung', 'microsoft'],
    priceRange: { min: 89900, max: 249900 },
    weightRange: { min: 400, max: 700 },
    variations: [
      { key: 'storage', values: [128, 256, 512, 1000, 2000] },
      { key: 'screenSize', values: [11, 12.9, 13] },
      { key: 'connectivity', values: ['wifi', 'cellular'] },
      { key: 'color', values: ['silver', 'black', 'white'] },
    ],
    tags: ['tablet', 'pro', 'creative'],
    screenSizes: ['10-15'],
    memoryOptions: ['128gb', '256gb', '512gb', '1tb'],
    colorOptions: ['silver', 'black', 'white'],
  },
  {
    category: 'tablets',
    subcategory: 'standard-tablets',
    assortmentId: 'standard-tablets',
    baseTitle: { en: 'Tablet', de: 'Tablet', fr: 'Tablette' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['apple', 'samsung', 'lenovo', 'amazon', 'xiaomi'],
    priceRange: { min: 24900, max: 89900 },
    weightRange: { min: 300, max: 500 },
    variations: [
      { key: 'storage', values: [32, 64, 128, 256] },
      { key: 'screenSize', values: [8, 10, 10.9, 11] },
      { key: 'color', values: ['silver', 'black', 'blue', 'pink'] },
    ],
    tags: ['tablet', 'entertainment', 'portable'],
    screenSizes: ['6-10', '10-15'],
    memoryOptions: ['32gb', '64gb', '128gb', '256gb'],
    colorOptions: ['silver', 'black', 'blue', 'pink'],
  },
  {
    category: 'tablets',
    subcategory: 'kids-tablets',
    assortmentId: 'kids-tablets',
    baseTitle: { en: 'Kids Tablet', de: 'Kinder Tablet', fr: 'Tablette Enfant' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['amazon', 'samsung', 'lenovo'],
    priceRange: { min: 9900, max: 19900 },
    weightRange: { min: 300, max: 450 },
    variations: [
      { key: 'storage', values: [16, 32] },
      { key: 'color', values: ['blue', 'pink', 'purple', 'green'] },
      { key: 'ageGroup', values: ['3-7', '6-12'] },
    ],
    tags: ['tablet', 'kids', 'education', 'parental-controls'],
    screenSizes: ['6-10'],
    memoryOptions: ['16gb', '32gb'],
    colorOptions: ['blue', 'pink', 'purple', 'green'],
  },
  {
    category: 'tablets',
    subcategory: 'e-readers',
    assortmentId: 'e-readers',
    baseTitle: { en: 'E-Reader', de: 'E-Reader', fr: 'Liseuse' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['amazon', 'kobo'],
    priceRange: { min: 9900, max: 39900 },
    weightRange: { min: 150, max: 250 },
    variations: [
      { key: 'storage', values: [8, 16, 32] },
      { key: 'screenSize', values: [6, 7, 10.2] },
      { key: 'color', values: ['black', 'white'] },
      { key: 'model', values: ['Basic', 'Paperwhite', 'Oasis', 'Scribe'] },
    ],
    tags: ['e-reader', 'kindle', 'books', 'reading'],
    screenSizes: ['6-10'],
    memoryOptions: ['8gb', '16gb', '32gb'],
    colorOptions: ['black', 'white'],
  },

  // ==================== HEADPHONES (expanded) ====================
  {
    category: 'headphones',
    subcategory: 'wireless-headphones',
    assortmentId: 'wireless-headphones',
    baseTitle: { en: 'Wireless Headphones', de: 'Kabellose Kopfhoerer', fr: 'Casque Sans Fil' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['sony', 'bose', 'apple', 'sennheiser', 'jbl', 'beats', 'bang-olufsen'],
    priceRange: { min: 14900, max: 59900 },
    weightRange: { min: 200, max: 350 },
    variations: [
      { key: 'color', values: ['black', 'white', 'silver', 'blue', 'beige', 'green'] },
      { key: 'anc', values: [true, false] },
      { key: 'model', values: ['Standard', 'Premium', 'Ultra'] },
    ],
    tags: ['headphones', 'wireless', 'bluetooth', 'noise-cancelling'],
    isWireless: true,
    colorOptions: ['black', 'white', 'silver', 'blue', 'beige', 'green'],
  },
  {
    category: 'headphones',
    subcategory: 'wired-headphones',
    assortmentId: 'wired-headphones',
    baseTitle: { en: 'Wired Headphones', de: 'Kabelgebundene Kopfhoerer', fr: 'Casque Filaire' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['sennheiser', 'audio-technica', 'beyerdynamic', 'akg', 'shure'],
    priceRange: { min: 4900, max: 49900 },
    weightRange: { min: 200, max: 400 },
    variations: [
      { key: 'type', values: ['open-back', 'closed-back'] },
      { key: 'impedance', values: ['32ohm', '80ohm', '250ohm', '600ohm'] },
      { key: 'color', values: ['black', 'silver'] },
    ],
    tags: ['headphones', 'wired', 'audiophile', 'studio'],
    isWireless: false,
    colorOptions: ['black', 'silver'],
  },
  {
    category: 'headphones',
    subcategory: 'gaming-headsets',
    assortmentId: 'gaming-headsets',
    baseTitle: { en: 'Gaming Headset', de: 'Gaming Headset', fr: 'Casque Gaming' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['razer', 'steelseries', 'corsair', 'logitech', 'hyperx', 'astro'],
    priceRange: { min: 4900, max: 34900 },
    weightRange: { min: 280, max: 400 },
    variations: [
      { key: 'color', values: ['black', 'white', 'pink'] },
      { key: 'wireless', values: [true, false] },
      { key: 'surround', values: ['stereo', '7.1'] },
    ],
    tags: ['headphones', 'gaming', 'microphone', 'surround'],
    colorOptions: ['black', 'white', 'pink'],
  },
  {
    category: 'headphones',
    subcategory: 'earbuds',
    assortmentId: 'earbuds',
    baseTitle: { en: 'Wireless Earbuds', de: 'Kabellose Ohrhoerer', fr: 'Ecouteurs Sans Fil' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['apple', 'samsung', 'sony', 'bose', 'jabra', 'google', 'beats'],
    priceRange: { min: 9900, max: 29900 },
    weightRange: { min: 40, max: 80 },
    variations: [
      { key: 'color', values: ['black', 'white', 'blue', 'pink', 'green', 'purple'] },
      { key: 'anc', values: [true, false] },
      { key: 'model', values: ['Standard', 'Pro'] },
    ],
    tags: ['earbuds', 'wireless', 'bluetooth', 'portable'],
    isWireless: true,
    colorOptions: ['black', 'white', 'blue', 'pink', 'green', 'purple'],
  },
  {
    category: 'headphones',
    subcategory: 'sports-earbuds',
    assortmentId: 'sports-earbuds',
    baseTitle: { en: 'Sports Earbuds', de: 'Sport Ohrhoerer', fr: 'Ecouteurs Sport' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['beats', 'jabra', 'bose', 'jaybird', 'jbl'],
    priceRange: { min: 7900, max: 24900 },
    weightRange: { min: 20, max: 50 },
    variations: [
      { key: 'color', values: ['black', 'white', 'red', 'blue', 'green'] },
      { key: 'waterproof', values: ['IPX4', 'IPX5', 'IPX7'] },
    ],
    tags: ['earbuds', 'sports', 'waterproof', 'fitness'],
    isWireless: true,
    colorOptions: ['black', 'white', 'red', 'blue', 'green'],
  },

  // ==================== KEYBOARDS (expanded) ====================
  {
    category: 'keyboards',
    subcategory: 'mechanical-keyboards',
    assortmentId: 'mechanical-keyboards',
    baseTitle: { en: 'Mechanical Keyboard', de: 'Mechanische Tastatur', fr: 'Clavier Mecanique' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['logitech', 'razer', 'corsair', 'steelseries', 'keychron', 'ducky'],
    priceRange: { min: 7900, max: 29900 },
    weightRange: { min: 800, max: 1500 },
    variations: [
      { key: 'switches', values: ['red', 'blue', 'brown', 'black', 'silent-red'] },
      { key: 'layout', values: ['full', 'TKL', '75%', '65%', '60%'] },
      { key: 'wireless', values: [true, false] },
      { key: 'color', values: ['black', 'white'] },
    ],
    tags: ['keyboard', 'mechanical', 'gaming'],
    connectivityOptions: ['usb-a', 'usb-c', 'bluetooth'],
    colorOptions: ['black', 'white'],
  },
  {
    category: 'keyboards',
    subcategory: 'membrane-keyboards',
    assortmentId: 'membrane-keyboards',
    baseTitle: { en: 'Membrane Keyboard', de: 'Membran Tastatur', fr: 'Clavier Membrane' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['logitech', 'microsoft', 'hp', 'dell'],
    priceRange: { min: 1900, max: 7900 },
    weightRange: { min: 400, max: 800 },
    variations: [
      { key: 'wireless', values: [true, false] },
      { key: 'layout', values: ['full', 'compact'] },
      { key: 'color', values: ['black', 'white', 'grey'] },
    ],
    tags: ['keyboard', 'membrane', 'office'],
    connectivityOptions: ['usb-a', 'bluetooth'],
    colorOptions: ['black', 'white', 'grey'],
  },
  {
    category: 'keyboards',
    subcategory: 'ergonomic-keyboards',
    assortmentId: 'ergonomic-keyboards',
    baseTitle: { en: 'Ergonomic Keyboard', de: 'Ergonomische Tastatur', fr: 'Clavier Ergonomique' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['logitech', 'microsoft', 'kinesis', 'keychron'],
    priceRange: { min: 9900, max: 39900 },
    weightRange: { min: 800, max: 1200 },
    variations: [
      { key: 'type', values: ['split', 'curved', 'vertical'] },
      { key: 'wireless', values: [true, false] },
      { key: 'color', values: ['black', 'white'] },
    ],
    tags: ['keyboard', 'ergonomic', 'health', 'office'],
    connectivityOptions: ['usb-c', 'bluetooth'],
    colorOptions: ['black', 'white'],
  },

  // ==================== MICE (expanded) ====================
  {
    category: 'mice',
    subcategory: 'gaming-mice',
    assortmentId: 'gaming-mice',
    baseTitle: { en: 'Gaming Mouse', de: 'Gaming Maus', fr: 'Souris Gaming' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['logitech', 'razer', 'corsair', 'steelseries', 'zowie', 'pulsar'],
    priceRange: { min: 4900, max: 19900 },
    weightRange: { min: 50, max: 120 },
    variations: [
      { key: 'wireless', values: [true, false] },
      { key: 'dpi', values: [16000, 25000, 30000] },
      { key: 'weight', values: ['ultralight', 'standard'] },
      { key: 'color', values: ['black', 'white', 'pink'] },
    ],
    tags: ['mouse', 'gaming', 'esports'],
    connectivityOptions: ['usb-a', 'usb-c'],
    colorOptions: ['black', 'white', 'pink'],
  },
  {
    category: 'mice',
    subcategory: 'office-mice',
    assortmentId: 'office-mice',
    baseTitle: { en: 'Office Mouse', de: 'Buero Maus', fr: 'Souris Bureau' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['logitech', 'microsoft', 'hp', 'dell', 'apple'],
    priceRange: { min: 1900, max: 9900 },
    weightRange: { min: 70, max: 120 },
    variations: [
      { key: 'wireless', values: [true, false] },
      { key: 'buttons', values: [3, 5, 7] },
      { key: 'color', values: ['black', 'white', 'grey', 'silver'] },
    ],
    tags: ['mouse', 'office', 'productivity'],
    connectivityOptions: ['usb-a', 'bluetooth'],
    colorOptions: ['black', 'white', 'grey', 'silver'],
  },
  {
    category: 'mice',
    subcategory: 'ergonomic-mice',
    assortmentId: 'ergonomic-mice',
    baseTitle: { en: 'Ergonomic Mouse', de: 'Ergonomische Maus', fr: 'Souris Ergonomique' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['logitech', 'microsoft', 'evoluent', 'anker'],
    priceRange: { min: 3900, max: 12900 },
    weightRange: { min: 100, max: 150 },
    variations: [
      { key: 'type', values: ['vertical', 'trackball', 'contoured'] },
      { key: 'wireless', values: [true, false] },
      { key: 'color', values: ['black', 'white', 'grey'] },
    ],
    tags: ['mouse', 'ergonomic', 'health', 'office'],
    connectivityOptions: ['usb-a', 'bluetooth'],
    colorOptions: ['black', 'white', 'grey'],
  },

  // ==================== MONITORS (expanded) ====================
  {
    category: 'monitors',
    subcategory: 'gaming-monitors',
    assortmentId: 'gaming-monitors',
    baseTitle: { en: 'Gaming Monitor', de: 'Gaming Monitor', fr: 'Ecran Gaming' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['asus', 'msi', 'samsung', 'lg', 'acer', 'benq', 'alienware'],
    priceRange: { min: 29900, max: 149900 },
    weightRange: { min: 4000, max: 10000 },
    variations: [
      { key: 'screenSize', values: [24, 27, 32, 34, 49] },
      { key: 'resolution', values: ['1080p', '1440p', '4K'] },
      { key: 'refreshRate', values: [144, 165, 240, 360] },
      { key: 'panel', values: ['IPS', 'VA', 'OLED'] },
    ],
    tags: ['monitor', 'gaming', 'high-refresh'],
    screenSizes: ['15-17', 'over-17'],
    connectivityOptions: ['hdmi', 'displayport', 'usb-c'],
    colorOptions: ['black'],
  },
  {
    category: 'monitors',
    subcategory: 'office-monitors',
    assortmentId: 'office-monitors',
    baseTitle: { en: 'Office Monitor', de: 'Buero Monitor', fr: 'Ecran Bureau' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['dell', 'hp', 'lg', 'samsung', 'benq', 'philips'],
    priceRange: { min: 14900, max: 69900 },
    weightRange: { min: 3000, max: 7000 },
    variations: [
      { key: 'screenSize', values: [24, 27, 32] },
      { key: 'resolution', values: ['1080p', '1440p', '4K'] },
      { key: 'panel', values: ['IPS', 'VA'] },
      { key: 'features', values: ['standard', 'usb-c-hub', 'webcam'] },
    ],
    tags: ['monitor', 'office', 'productivity'],
    screenSizes: ['15-17', 'over-17'],
    connectivityOptions: ['hdmi', 'displayport', 'usb-c'],
    colorOptions: ['black', 'silver', 'white'],
  },
  {
    category: 'monitors',
    subcategory: 'ultrawide-monitors',
    assortmentId: 'ultrawide-monitors',
    baseTitle: { en: 'Ultrawide Monitor', de: 'Ultrawide Monitor', fr: 'Ecran Ultralarge' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['lg', 'samsung', 'dell', 'asus'],
    priceRange: { min: 39900, max: 199900 },
    weightRange: { min: 6000, max: 12000 },
    variations: [
      { key: 'screenSize', values: [34, 38, 40, 49] },
      { key: 'resolution', values: ['UWFHD', 'UWQHD', '5K2K'] },
      { key: 'curved', values: [true, false] },
      { key: 'panel', values: ['IPS', 'VA', 'OLED'] },
    ],
    tags: ['monitor', 'ultrawide', 'productivity', 'immersive'],
    screenSizes: ['over-17'],
    connectivityOptions: ['hdmi', 'displayport', 'usb-c', 'thunderbolt'],
    colorOptions: ['black', 'white'],
  },
  {
    category: 'monitors',
    subcategory: 'portable-monitors',
    assortmentId: 'portable-monitors',
    baseTitle: { en: 'Portable Monitor', de: 'Tragbarer Monitor', fr: 'Ecran Portable' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['asus', 'lenovo', 'lg', 'viewsonic'],
    priceRange: { min: 14900, max: 49900 },
    weightRange: { min: 500, max: 1000 },
    variations: [
      { key: 'screenSize', values: [13, 14, 15, 17] },
      { key: 'resolution', values: ['1080p', '4K'] },
      { key: 'touchscreen', values: [true, false] },
    ],
    tags: ['monitor', 'portable', 'travel', 'usb-c'],
    screenSizes: ['10-15', '15-17'],
    connectivityOptions: ['usb-c', 'hdmi'],
    colorOptions: ['black', 'silver'],
  },

  // ==================== SMARTWATCHES & WEARABLES (expanded) ====================
  {
    category: 'smartwatches',
    subcategory: 'premium-smartwatches',
    assortmentId: 'premium-smartwatches',
    baseTitle: { en: 'Premium Smartwatch', de: 'Premium Smartwatch', fr: 'Montre Connectee Premium' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['apple', 'samsung', 'garmin'],
    priceRange: { min: 39900, max: 99900 },
    weightRange: { min: 40, max: 80 },
    variations: [
      { key: 'size', values: ['40mm', '44mm', '45mm', '49mm'] },
      { key: 'color', values: ['black', 'silver', 'gold', 'blue', 'green'] },
      { key: 'material', values: ['aluminum', 'stainless-steel', 'titanium'] },
      { key: 'connectivity', values: ['gps', 'cellular'] },
    ],
    tags: ['smartwatch', 'wearable', 'premium'],
    isWireless: true,
    colorOptions: ['black', 'silver', 'gold', 'blue', 'green'],
  },
  {
    category: 'smartwatches',
    subcategory: 'sport-smartwatches',
    assortmentId: 'sport-smartwatches',
    baseTitle: { en: 'Sports Smartwatch', de: 'Sport Smartwatch', fr: 'Montre Sport Connectee' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['garmin', 'polar', 'suunto', 'coros'],
    priceRange: { min: 19900, max: 79900 },
    weightRange: { min: 40, max: 70 },
    variations: [
      { key: 'size', values: ['42mm', '46mm', '47mm', '51mm'] },
      { key: 'color', values: ['black', 'white', 'orange', 'green'] },
      { key: 'sport', values: ['running', 'triathlon', 'outdoor', 'golf'] },
    ],
    tags: ['smartwatch', 'sports', 'gps', 'training'],
    isWireless: true,
    colorOptions: ['black', 'white', 'orange', 'green'],
  },
  {
    category: 'smartwatches',
    subcategory: 'budget-smartwatches',
    assortmentId: 'budget-smartwatches',
    baseTitle: { en: 'Budget Smartwatch', de: 'Budget Smartwatch', fr: 'Montre Connectee Budget' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['fitbit', 'xiaomi', 'amazfit', 'samsung'],
    priceRange: { min: 9900, max: 24900 },
    weightRange: { min: 25, max: 50 },
    variations: [
      { key: 'size', values: ['small', 'large'] },
      { key: 'color', values: ['black', 'white', 'blue', 'pink'] },
    ],
    tags: ['smartwatch', 'budget', 'fitness'],
    isWireless: true,
    colorOptions: ['black', 'white', 'blue', 'pink'],
  },
  {
    category: 'fitness-trackers',
    assortmentId: 'fitness-trackers',
    baseTitle: { en: 'Fitness Tracker', de: 'Fitness Tracker', fr: 'Bracelet Fitness' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['fitbit', 'garmin', 'xiaomi', 'samsung', 'whoop'],
    priceRange: { min: 4900, max: 19900 },
    weightRange: { min: 15, max: 35 },
    variations: [
      { key: 'color', values: ['black', 'white', 'blue', 'pink', 'green', 'purple'] },
      { key: 'model', values: ['Basic', 'Active', 'Premium'] },
    ],
    tags: ['fitness', 'tracker', 'wearable', 'health'],
    isWireless: true,
    colorOptions: ['black', 'white', 'blue', 'pink', 'green', 'purple'],
  },

  // ==================== SPEAKERS (expanded) ====================
  {
    category: 'speakers',
    subcategory: 'portable-speakers',
    assortmentId: 'portable-speakers',
    baseTitle: { en: 'Portable Speaker', de: 'Tragbarer Lautsprecher', fr: 'Enceinte Portable' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['jbl', 'bose', 'sony', 'marshall', 'ultimate-ears', 'anker'],
    priceRange: { min: 2900, max: 39900 },
    weightRange: { min: 200, max: 2000 },
    variations: [
      { key: 'size', values: ['mini', 'small', 'medium', 'large'] },
      { key: 'color', values: ['black', 'blue', 'red', 'green', 'white', 'pink'] },
      { key: 'waterproof', values: ['IPX5', 'IPX7', 'IP67'] },
    ],
    tags: ['speaker', 'portable', 'bluetooth', 'waterproof'],
    isWireless: true,
    colorOptions: ['black', 'blue', 'red', 'green', 'white', 'pink'],
  },
  {
    category: 'speakers',
    subcategory: 'smart-speakers',
    assortmentId: 'smart-speakers',
    baseTitle: { en: 'Smart Speaker', de: 'Smart Lautsprecher', fr: 'Enceinte Intelligente' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['amazon', 'google', 'apple', 'sonos', 'bose'],
    priceRange: { min: 4900, max: 39900 },
    weightRange: { min: 300, max: 3000 },
    variations: [
      { key: 'size', values: ['mini', 'standard', 'max'] },
      { key: 'color', values: ['black', 'white', 'grey', 'blue'] },
      { key: 'display', values: [true, false] },
    ],
    tags: ['speaker', 'smart', 'voice-assistant', 'wifi'],
    isWireless: true,
    colorOptions: ['black', 'white', 'grey', 'blue'],
  },
  {
    category: 'speakers',
    subcategory: 'soundbars',
    assortmentId: 'soundbars',
    baseTitle: { en: 'Soundbar', de: 'Soundbar', fr: 'Barre de Son' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['samsung', 'sony', 'bose', 'lg', 'sonos', 'vizio'],
    priceRange: { min: 9900, max: 149900 },
    weightRange: { min: 2000, max: 6000 },
    variations: [
      { key: 'channels', values: ['2.0', '2.1', '3.1', '5.1', '7.1', '9.1'] },
      { key: 'dolbyAtmos', values: [true, false] },
      { key: 'subwoofer', values: ['none', 'wireless', 'included'] },
    ],
    tags: ['soundbar', 'home-theater', 'tv-audio', 'dolby'],
    isWireless: true,
    connectivityOptions: ['hdmi', 'bluetooth', 'wifi'],
    colorOptions: ['black', 'silver'],
  },
  {
    category: 'speakers',
    subcategory: 'bookshelf-speakers',
    assortmentId: 'bookshelf-speakers',
    baseTitle: { en: 'Bookshelf Speakers', de: 'Regallautsprecher', fr: 'Enceintes Bibliotheque' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['sony', 'bose', 'klipsch', 'edifier', 'audioengine', 'kef'],
    priceRange: { min: 9900, max: 99900 },
    weightRange: { min: 3000, max: 10000 },
    variations: [
      { key: 'type', values: ['passive', 'powered'] },
      { key: 'wireless', values: [true, false] },
      { key: 'color', values: ['black', 'white', 'walnut'] },
    ],
    tags: ['speakers', 'hifi', 'bookshelf', 'audiophile'],
    colorOptions: ['black', 'white', 'walnut'],
  },

  // ==================== STORAGE (expanded) ====================
  {
    category: 'storage',
    subcategory: 'external-ssd',
    assortmentId: 'external-ssd',
    baseTitle: { en: 'External SSD', de: 'Externe SSD', fr: 'SSD Externe' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['samsung', 'sandisk', 'western-digital', 'seagate', 'crucial'],
    priceRange: { min: 6900, max: 39900 },
    weightRange: { min: 30, max: 100 },
    variations: [
      { key: 'capacity', values: ['500GB', '1TB', '2TB', '4TB'] },
      { key: 'speed', values: ['USB3.2-Gen1', 'USB3.2-Gen2', 'USB4', 'Thunderbolt'] },
      { key: 'color', values: ['black', 'silver', 'blue'] },
    ],
    tags: ['storage', 'ssd', 'portable', 'fast'],
    memoryOptions: ['512gb', '1tb'],
    connectivityOptions: ['usb-c', 'thunderbolt'],
    colorOptions: ['black', 'silver', 'blue'],
  },
  {
    category: 'storage',
    subcategory: 'external-hdd',
    assortmentId: 'external-hdd',
    baseTitle: { en: 'External HDD', de: 'Externe Festplatte', fr: 'Disque Dur Externe' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['western-digital', 'seagate', 'toshiba', 'lacie'],
    priceRange: { min: 4900, max: 24900 },
    weightRange: { min: 150, max: 300 },
    variations: [
      { key: 'capacity', values: ['1TB', '2TB', '4TB', '5TB', '8TB'] },
      { key: 'type', values: ['portable', 'desktop'] },
      { key: 'color', values: ['black', 'silver', 'blue', 'red'] },
    ],
    tags: ['storage', 'hdd', 'backup', 'large-capacity'],
    memoryOptions: ['1tb'],
    connectivityOptions: ['usb-a', 'usb-c'],
    colorOptions: ['black', 'silver', 'blue', 'red'],
  },
  {
    category: 'storage',
    subcategory: 'usb-flash-drives',
    assortmentId: 'usb-flash-drives',
    baseTitle: { en: 'USB Flash Drive', de: 'USB Stick', fr: 'Cle USB' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['sandisk', 'samsung', 'kingston', 'corsair'],
    priceRange: { min: 900, max: 9900 },
    weightRange: { min: 5, max: 30 },
    variations: [
      { key: 'capacity', values: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'] },
      { key: 'speed', values: ['USB3.0', 'USB3.1', 'USB3.2'] },
      { key: 'color', values: ['black', 'silver', 'blue'] },
    ],
    tags: ['storage', 'usb', 'flash-drive', 'portable'],
    memoryOptions: ['32gb', '64gb', '128gb', '256gb', '512gb', '1tb'],
    connectivityOptions: ['usb-a', 'usb-c'],
    colorOptions: ['black', 'silver', 'blue'],
  },
  {
    category: 'storage',
    subcategory: 'memory-cards',
    assortmentId: 'memory-cards',
    baseTitle: { en: 'Memory Card', de: 'Speicherkarte', fr: 'Carte Memoire' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['sandisk', 'samsung', 'lexar', 'sony'],
    priceRange: { min: 1900, max: 19900 },
    weightRange: { min: 1, max: 5 },
    variations: [
      { key: 'capacity', values: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
      { key: 'type', values: ['SD', 'microSD', 'CFexpress'] },
      { key: 'speed', values: ['V30', 'V60', 'V90'] },
    ],
    tags: ['storage', 'memory-card', 'sd', 'camera'],
    memoryOptions: ['64gb', '128gb', '256gb', '512gb', '1tb'],
    colorOptions: ['black'],
  },
  {
    category: 'storage',
    subcategory: 'nas-devices',
    assortmentId: 'nas-devices',
    baseTitle: { en: 'NAS Device', de: 'NAS Geraet', fr: 'Serveur NAS' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['synology', 'qnap', 'western-digital', 'asustor'],
    priceRange: { min: 14900, max: 99900 },
    weightRange: { min: 1000, max: 5000 },
    variations: [
      { key: 'bays', values: [1, 2, 4, 5, 8] },
      { key: 'type', values: ['home', 'business', 'enterprise'] },
    ],
    tags: ['storage', 'nas', 'network', 'backup', 'server'],
    connectivityOptions: ['ethernet', 'usb-a'],
    colorOptions: ['black', 'white'],
  },

  // ==================== CAMERAS (expanded) ====================
  {
    category: 'cameras',
    subcategory: 'mirrorless-cameras',
    assortmentId: 'mirrorless-cameras',
    baseTitle: { en: 'Mirrorless Camera', de: 'Spiegellose Kamera', fr: 'Appareil Hybride' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['sony', 'canon', 'nikon', 'fujifilm', 'panasonic'],
    priceRange: { min: 69900, max: 399900 },
    weightRange: { min: 400, max: 800 },
    variations: [
      { key: 'sensor', values: ['APS-C', 'Full-Frame', 'Medium-Format'] },
      { key: 'resolution', values: ['24MP', '33MP', '45MP', '61MP'] },
      { key: 'video', values: ['4K30', '4K60', '4K120', '8K'] },
    ],
    tags: ['camera', 'mirrorless', 'photography', 'video'],
    colorOptions: ['black', 'silver'],
  },
  {
    category: 'cameras',
    subcategory: 'dslr-cameras',
    assortmentId: 'dslr-cameras',
    baseTitle: { en: 'DSLR Camera', de: 'Spiegelreflexkamera', fr: 'Appareil Reflex' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['canon', 'nikon', 'pentax'],
    priceRange: { min: 49900, max: 299900 },
    weightRange: { min: 600, max: 1200 },
    variations: [
      { key: 'sensor', values: ['APS-C', 'Full-Frame'] },
      { key: 'resolution', values: ['24MP', '30MP', '45MP'] },
      { key: 'level', values: ['entry', 'enthusiast', 'professional'] },
    ],
    tags: ['camera', 'dslr', 'photography'],
    colorOptions: ['black'],
  },
  {
    category: 'cameras',
    subcategory: 'action-cameras',
    assortmentId: 'action-cameras',
    baseTitle: { en: 'Action Camera', de: 'Action Kamera', fr: 'Camera Action' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['gopro', 'dji', 'insta360', 'sony'],
    priceRange: { min: 19900, max: 59900 },
    weightRange: { min: 100, max: 200 },
    variations: [
      { key: 'resolution', values: ['4K', '5.3K', '8K'] },
      { key: 'stabilization', values: ['standard', 'hypersmooth', '360'] },
      { key: 'waterproof', values: ['10m', '33m', '60m'] },
    ],
    tags: ['camera', 'action', 'waterproof', 'adventure'],
    colorOptions: ['black'],
  },
  {
    category: 'cameras',
    subcategory: 'instant-cameras',
    assortmentId: 'instant-cameras',
    baseTitle: { en: 'Instant Camera', de: 'Sofortbildkamera', fr: 'Appareil Instantane' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['fujifilm', 'polaroid', 'kodak'],
    priceRange: { min: 6900, max: 29900 },
    weightRange: { min: 200, max: 500 },
    variations: [
      { key: 'filmSize', values: ['mini', 'square', 'wide'] },
      { key: 'color', values: ['black', 'white', 'blue', 'pink', 'yellow'] },
    ],
    tags: ['camera', 'instant', 'polaroid', 'fun'],
    colorOptions: ['black', 'white', 'blue', 'pink', 'yellow'],
  },
  {
    category: 'cameras',
    subcategory: 'webcams',
    assortmentId: 'webcams',
    baseTitle: { en: 'Webcam', de: 'Webcam', fr: 'Webcam' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['logitech', 'razer', 'elgato', 'obsbot', 'anker'],
    priceRange: { min: 4900, max: 29900 },
    weightRange: { min: 100, max: 300 },
    variations: [
      { key: 'resolution', values: ['1080p', '2K', '4K'] },
      { key: 'features', values: ['basic', 'autofocus', 'ai-tracking'] },
      { key: 'color', values: ['black', 'white'] },
    ],
    tags: ['webcam', 'streaming', 'video-conference'],
    connectivityOptions: ['usb-a', 'usb-c'],
    colorOptions: ['black', 'white'],
  },
  {
    category: 'cameras',
    subcategory: 'camera-lenses',
    assortmentId: 'camera-lenses',
    baseTitle: { en: 'Camera Lens', de: 'Kameraobjektiv', fr: 'Objectif Photo' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['sony', 'canon', 'nikon', 'sigma', 'tamron', 'fujifilm'],
    priceRange: { min: 29900, max: 299900 },
    weightRange: { min: 200, max: 1500 },
    variations: [
      { key: 'focalLength', values: ['14mm', '24mm', '35mm', '50mm', '85mm', '70-200mm', '100-400mm'] },
      { key: 'aperture', values: ['f/1.2', 'f/1.4', 'f/1.8', 'f/2.8', 'f/4'] },
      { key: 'mount', values: ['E-mount', 'RF-mount', 'Z-mount', 'X-mount'] },
    ],
    tags: ['lens', 'camera', 'photography'],
    colorOptions: ['black'],
  },

  // ==================== NETWORKING (expanded) ====================
  {
    category: 'routers',
    subcategory: 'wifi-routers',
    assortmentId: 'wifi-routers',
    baseTitle: { en: 'WiFi Router', de: 'WLAN Router', fr: 'Routeur WiFi' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['asus', 'netgear', 'tp-link', 'linksys', 'ubiquiti'],
    priceRange: { min: 4900, max: 39900 },
    weightRange: { min: 300, max: 800 },
    variations: [
      { key: 'standard', values: ['WiFi-5', 'WiFi-6', 'WiFi-6E', 'WiFi-7'] },
      { key: 'speed', values: ['AX1800', 'AX3000', 'AX5400', 'AX6000', 'BE9300'] },
      { key: 'color', values: ['black', 'white'] },
    ],
    tags: ['router', 'networking', 'wifi'],
    isWireless: true,
    connectivityOptions: ['wifi', 'ethernet'],
    colorOptions: ['black', 'white'],
  },
  {
    category: 'routers',
    subcategory: 'mesh-systems',
    assortmentId: 'mesh-systems',
    baseTitle: { en: 'Mesh WiFi System', de: 'Mesh WLAN System', fr: 'Systeme WiFi Mesh' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['google', 'eero', 'netgear', 'tp-link', 'asus', 'linksys'],
    priceRange: { min: 14900, max: 59900 },
    weightRange: { min: 200, max: 500 },
    variations: [
      { key: 'units', values: [2, 3, 4] },
      { key: 'standard', values: ['WiFi-6', 'WiFi-6E', 'WiFi-7'] },
      { key: 'color', values: ['white', 'black'] },
    ],
    tags: ['mesh', 'wifi', 'networking', 'whole-home'],
    isWireless: true,
    connectivityOptions: ['wifi', 'ethernet'],
    colorOptions: ['white', 'black'],
  },
  {
    category: 'networking',
    subcategory: 'network-switches',
    assortmentId: 'network-switches',
    baseTitle: { en: 'Network Switch', de: 'Netzwerk Switch', fr: 'Switch Reseau' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['netgear', 'tp-link', 'ubiquiti', 'cisco'],
    priceRange: { min: 1900, max: 29900 },
    weightRange: { min: 200, max: 1000 },
    variations: [
      { key: 'ports', values: [5, 8, 16, 24] },
      { key: 'speed', values: ['1Gbps', '2.5Gbps', '10Gbps'] },
      { key: 'managed', values: [true, false] },
    ],
    tags: ['switch', 'networking', 'ethernet'],
    connectivityOptions: ['ethernet'],
    colorOptions: ['black', 'white'],
  },

  // ==================== PRINTERS (expanded) ====================
  {
    category: 'printers',
    subcategory: 'inkjet-printers',
    assortmentId: 'inkjet-printers',
    baseTitle: { en: 'Inkjet Printer', de: 'Tintenstrahldrucker', fr: 'Imprimante Jet dEncre' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['hp', 'canon', 'epson', 'brother'],
    priceRange: { min: 4900, max: 29900 },
    weightRange: { min: 3000, max: 8000 },
    variations: [
      { key: 'type', values: ['print-only', 'all-in-one', 'photo'] },
      { key: 'duplex', values: [true, false] },
      { key: 'color', values: ['black', 'white'] },
    ],
    tags: ['printer', 'inkjet', 'photo', 'home'],
    isWireless: true,
    connectivityOptions: ['wifi', 'usb-a'],
    colorOptions: ['black', 'white'],
  },
  {
    category: 'printers',
    subcategory: 'laser-printers',
    assortmentId: 'laser-printers',
    baseTitle: { en: 'Laser Printer', de: 'Laserdrucker', fr: 'Imprimante Laser' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['hp', 'brother', 'canon', 'lexmark'],
    priceRange: { min: 12900, max: 59900 },
    weightRange: { min: 5000, max: 15000 },
    variations: [
      { key: 'color', values: ['monochrome', 'color'] },
      { key: 'type', values: ['print-only', 'all-in-one'] },
      { key: 'speed', values: ['20ppm', '30ppm', '40ppm'] },
    ],
    tags: ['printer', 'laser', 'office', 'business'],
    isWireless: true,
    connectivityOptions: ['wifi', 'ethernet', 'usb-a'],
    colorOptions: ['black', 'white'],
  },

  // ==================== GAMING (expanded) ====================
  {
    category: 'consoles',
    assortmentId: 'consoles',
    baseTitle: { en: 'Gaming Console', de: 'Spielkonsole', fr: 'Console de Jeux' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['sony', 'microsoft', 'nintendo'],
    priceRange: { min: 29900, max: 54900 },
    weightRange: { min: 2000, max: 4500 },
    variations: [
      { key: 'edition', values: ['standard', 'digital', 'pro', 'slim'] },
      { key: 'storage', values: ['512GB', '1TB', '2TB'] },
      { key: 'color', values: ['black', 'white'] },
    ],
    tags: ['console', 'gaming', 'entertainment'],
    connectivityOptions: ['hdmi', 'usb-a', 'wifi', 'bluetooth'],
    colorOptions: ['black', 'white'],
  },
  {
    category: 'gaming',
    subcategory: 'gaming-controllers',
    assortmentId: 'gaming-controllers',
    baseTitle: { en: 'Gaming Controller', de: 'Gaming Controller', fr: 'Manette de Jeu' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['sony', 'microsoft', 'nintendo', 'razer', 'scuf', '8bitdo'],
    priceRange: { min: 4900, max: 19900 },
    weightRange: { min: 200, max: 350 },
    variations: [
      { key: 'platform', values: ['playstation', 'xbox', 'switch', 'pc'] },
      { key: 'wireless', values: [true, false] },
      { key: 'color', values: ['black', 'white', 'blue', 'red', 'purple'] },
    ],
    tags: ['controller', 'gaming', 'gamepad'],
    isWireless: true,
    colorOptions: ['black', 'white', 'blue', 'red', 'purple'],
  },
  {
    category: 'gaming',
    subcategory: 'gaming-chairs',
    assortmentId: 'gaming-chairs',
    baseTitle: { en: 'Gaming Chair', de: 'Gaming Stuhl', fr: 'Chaise Gaming' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['secretlab', 'razer', 'corsair', 'dxracer', 'noblechairs'],
    priceRange: { min: 19900, max: 59900 },
    weightRange: { min: 20000, max: 30000 },
    variations: [
      { key: 'size', values: ['small', 'regular', 'xl'] },
      { key: 'material', values: ['fabric', 'pu-leather', 'napa-leather'] },
      { key: 'color', values: ['black', 'grey', 'blue', 'red', 'pink'] },
    ],
    tags: ['chair', 'gaming', 'ergonomic', 'furniture'],
    colorOptions: ['black', 'grey', 'blue', 'red', 'pink'],
  },
  {
    category: 'gaming',
    subcategory: 'vr-headsets',
    assortmentId: 'vr-headsets',
    baseTitle: { en: 'VR Headset', de: 'VR Brille', fr: 'Casque VR' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['meta', 'sony', 'htc', 'valve', 'pico'],
    priceRange: { min: 29900, max: 109900 },
    weightRange: { min: 400, max: 700 },
    variations: [
      { key: 'storage', values: ['128GB', '256GB', '512GB'] },
      { key: 'type', values: ['standalone', 'pc-vr', 'playstation'] },
    ],
    tags: ['vr', 'virtual-reality', 'gaming', 'immersive'],
    isWireless: true,
    colorOptions: ['black', 'white'],
  },
  {
    category: 'gaming',
    subcategory: 'streaming-equipment',
    assortmentId: 'streaming-equipment',
    baseTitle: { en: 'Streaming Equipment', de: 'Streaming Ausruestung', fr: 'Equipement Streaming' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['elgato', 'razer', 'logitech', 'rode', 'shure'],
    priceRange: { min: 9900, max: 39900 },
    weightRange: { min: 200, max: 2000 },
    variations: [
      {
        key: 'type',
        values: ['capture-card', 'stream-deck', 'key-light', 'microphone', 'green-screen'],
      },
      { key: 'level', values: ['starter', 'pro'] },
    ],
    tags: ['streaming', 'content-creation', 'twitch', 'youtube'],
    colorOptions: ['black', 'white'],
  },

  // ==================== PHONE ACCESSORIES (expanded) ====================
  {
    category: 'cases',
    assortmentId: 'cases',
    baseTitle: { en: 'Phone Case', de: 'Handyhuelle', fr: 'Coque Telephone' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['spigen', 'otterbox', 'belkin', 'apple', 'samsung', 'casetify', 'mous'],
    priceRange: { min: 1900, max: 6900 },
    weightRange: { min: 20, max: 80 },
    variations: [
      { key: 'type', values: ['slim', 'rugged', 'wallet', 'clear', 'magsafe'] },
      { key: 'color', values: ['black', 'clear', 'blue', 'red', 'green', 'pink', 'purple'] },
      { key: 'phone', values: ['iPhone15', 'iPhone16', 'Galaxy-S24', 'Pixel-8'] },
    ],
    tags: ['case', 'protection', 'accessory'],
    colorOptions: ['black', 'clear', 'blue', 'red', 'green', 'pink', 'purple'],
  },
  {
    category: 'chargers',
    assortmentId: 'chargers',
    baseTitle: { en: 'Charger', de: 'Ladegeraet', fr: 'Chargeur' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['anker', 'belkin', 'apple', 'samsung', 'ugreen', 'baseus'],
    priceRange: { min: 1900, max: 9900 },
    weightRange: { min: 50, max: 300 },
    variations: [
      { key: 'type', values: ['wall', 'wireless', 'car', 'multi-port', 'magsafe', 'power-bank'] },
      { key: 'power', values: ['20W', '30W', '45W', '65W', '100W', '140W'] },
      { key: 'ports', values: [1, 2, 3, 4] },
    ],
    tags: ['charger', 'power', 'accessory', 'fast-charging'],
    isWireless: true,
    connectivityOptions: ['usb-c', 'usb-a'],
    colorOptions: ['black', 'white'],
  },
  {
    category: 'screen-protectors',
    assortmentId: 'screen-protectors',
    baseTitle: { en: 'Screen Protector', de: 'Displayschutz', fr: 'Protecteur Ecran' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['spigen', 'belkin', 'zagg', 'amfilm'],
    priceRange: { min: 900, max: 4900 },
    weightRange: { min: 5, max: 20 },
    variations: [
      { key: 'type', values: ['tempered-glass', 'film', 'privacy', 'matte'] },
      { key: 'phone', values: ['iPhone15', 'iPhone16', 'Galaxy-S24', 'Pixel-8'] },
      { key: 'pack', values: [1, 2, 3] },
    ],
    tags: ['screen-protector', 'protection', 'accessory'],
    colorOptions: ['clear'],
  },
  {
    category: 'cables',
    assortmentId: 'cables',
    baseTitle: { en: 'Cable', de: 'Kabel', fr: 'Cable' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['anker', 'belkin', 'apple', 'ugreen', 'amazon-basics'],
    priceRange: { min: 900, max: 3900 },
    weightRange: { min: 20, max: 100 },
    variations: [
      { key: 'type', values: ['USB-C-to-C', 'USB-C-to-Lightning', 'USB-A-to-C', 'HDMI', 'DisplayPort'] },
      { key: 'length', values: ['0.5m', '1m', '2m', '3m'] },
      { key: 'color', values: ['black', 'white'] },
    ],
    tags: ['cable', 'accessory', 'charging', 'data'],
    connectivityOptions: ['usb-c', 'usb-a', 'lightning', 'hdmi'],
    colorOptions: ['black', 'white'],
  },
  {
    category: 'power-banks',
    assortmentId: 'power-banks',
    baseTitle: { en: 'Power Bank', de: 'Powerbank', fr: 'Batterie Externe' },
    baseDescription: { en: '', de: '', fr: '' },
    brands: ['anker', 'belkin', 'samsung', 'xiaomi', 'mophie', 'zendure'],
    priceRange: { min: 1900, max: 14900 },
    weightRange: { min: 150, max: 500 },
    variations: [
      { key: 'capacity', values: ['5000mAh', '10000mAh', '20000mAh', '26800mAh'] },
      { key: 'power', values: ['18W', '30W', '45W', '65W', '100W'] },
      { key: 'color', values: ['black', 'white', 'blue'] },
    ],
    tags: ['power-bank', 'portable-charger', 'battery', 'travel'],
    connectivityOptions: ['usb-c', 'usb-a'],
    colorOptions: ['black', 'white', 'blue'],
  },
];
