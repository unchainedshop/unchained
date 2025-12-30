// Multi-language translations for categories, filters, and common terms

export interface CategoryTranslation {
  title: string;
  slug: string;
  description?: string;
}

export interface FilterTranslation {
  title: string;
  subtitle?: string;
}

// Category translations - expanded for 100+ categories
export const categoryTranslations: Record<string, Record<string, CategoryTranslation>> = {
  // ========================================
  // Root
  // ========================================
  'electronics-store': {
    en: { title: 'Electronics Store', slug: 'electronics-store', description: 'Shop the latest electronics and tech gadgets' },
    de: { title: 'Elektronik Shop', slug: 'elektronik-shop', description: 'Die neuesten Elektronik- und Technik-Gadgets kaufen' },
    fr: { title: 'Boutique Electronique', slug: 'boutique-electronique', description: 'Achetez les derniers gadgets electroniques' },
  },

  // ========================================
  // Computers & Laptops
  // ========================================
  'computers-laptops': {
    en: { title: 'Computers & Laptops', slug: 'computers-laptops', description: 'Desktop computers and portable laptops for work and play' },
    de: { title: 'Computer & Laptops', slug: 'computer-laptops', description: 'Desktop-Computer und tragbare Laptops fuer Arbeit und Freizeit' },
    fr: { title: 'Ordinateurs & Portables', slug: 'ordinateurs-portables', description: 'Ordinateurs de bureau et portables pour le travail et les loisirs' },
  },
  laptops: {
    en: { title: 'Laptops', slug: 'laptops', description: 'Portable computing power for every need' },
    de: { title: 'Laptops', slug: 'laptops', description: 'Tragbare Rechenleistung fuer jeden Bedarf' },
    fr: { title: 'Ordinateurs Portables', slug: 'ordinateurs-portables', description: 'Puissance informatique portable pour tous les besoins' },
  },
  'gaming-laptops': {
    en: { title: 'Gaming Laptops', slug: 'gaming-laptops', description: 'High-performance laptops for serious gamers' },
    de: { title: 'Gaming Laptops', slug: 'gaming-laptops', description: 'Hochleistungs-Laptops fuer ernsthafte Gamer' },
    fr: { title: 'Portables Gaming', slug: 'portables-gaming', description: 'Portables haute performance pour les gamers serieux' },
  },
  'business-laptops': {
    en: { title: 'Business Laptops', slug: 'business-laptops', description: 'Professional laptops for enterprise and productivity' },
    de: { title: 'Business Laptops', slug: 'business-laptops', description: 'Professionelle Laptops fuer Unternehmen und Produktivitaet' },
    fr: { title: 'Portables Professionnels', slug: 'portables-professionnels', description: 'Portables professionnels pour entreprise et productivite' },
  },
  ultrabooks: {
    en: { title: 'Ultrabooks', slug: 'ultrabooks', description: 'Ultra-thin and lightweight laptops for mobility' },
    de: { title: 'Ultrabooks', slug: 'ultrabooks', description: 'Ultraduenne und leichte Laptops fuer Mobilitaet' },
    fr: { title: 'Ultrabooks', slug: 'ultrabooks', description: 'Portables ultra-fins et legers pour la mobilite' },
  },
  'workstation-laptops': {
    en: { title: 'Workstation Laptops', slug: 'workstation-laptops', description: 'Powerful mobile workstations for professionals' },
    de: { title: 'Workstation Laptops', slug: 'workstation-laptops', description: 'Leistungsstarke mobile Workstations fuer Profis' },
    fr: { title: 'Portables Workstation', slug: 'portables-workstation', description: 'Stations de travail mobiles puissantes pour professionnels' },
  },
  'budget-laptops': {
    en: { title: 'Budget Laptops', slug: 'budget-laptops', description: 'Affordable laptops without compromise' },
    de: { title: 'Guenstige Laptops', slug: 'guenstige-laptops', description: 'Erschwingliche Laptops ohne Kompromisse' },
    fr: { title: 'Portables Budget', slug: 'portables-budget', description: 'Portables abordables sans compromis' },
  },
  'student-laptops': {
    en: { title: 'Student Laptops', slug: 'student-laptops', description: 'Perfect laptops for students and education' },
    de: { title: 'Studenten Laptops', slug: 'studenten-laptops', description: 'Perfekte Laptops fuer Studenten und Bildung' },
    fr: { title: 'Portables Etudiants', slug: 'portables-etudiants', description: 'Portables parfaits pour etudiants et education' },
  },
  '2-in-1-laptops': {
    en: { title: '2-in-1 Laptops', slug: '2-in-1-laptops', description: 'Convertible laptops with tablet mode' },
    de: { title: '2-in-1 Laptops', slug: '2-in-1-laptops', description: 'Konvertierbare Laptops mit Tablet-Modus' },
    fr: { title: 'Portables 2-en-1', slug: 'portables-2-en-1', description: 'Portables convertibles avec mode tablette' },
  },
  desktops: {
    en: { title: 'Desktop Computers', slug: 'desktops', description: 'Powerful desktop computers for home and office' },
    de: { title: 'Desktop Computer', slug: 'desktop-computer', description: 'Leistungsstarke Desktop-Computer fuer Zuhause und Buero' },
    fr: { title: 'Ordinateurs de Bureau', slug: 'ordinateurs-bureau', description: 'Ordinateurs de bureau puissants pour la maison et le bureau' },
  },
  'gaming-desktops': {
    en: { title: 'Gaming Desktops', slug: 'gaming-desktops', description: 'High-end gaming PCs for ultimate performance' },
    de: { title: 'Gaming Desktops', slug: 'gaming-desktops', description: 'High-End Gaming-PCs fuer ultimative Leistung' },
    fr: { title: 'PC Gaming', slug: 'pc-gaming', description: 'PC gaming haut de gamme pour des performances ultimes' },
  },
  'workstation-desktops': {
    en: { title: 'Workstation Desktops', slug: 'workstation-desktops', description: 'Professional workstations for demanding tasks' },
    de: { title: 'Workstation Desktops', slug: 'workstation-desktops', description: 'Professionelle Workstations fuer anspruchsvolle Aufgaben' },
    fr: { title: 'Workstations', slug: 'workstations', description: 'Stations de travail professionnelles pour taches exigeantes' },
  },
  'mini-pcs': {
    en: { title: 'Mini PCs', slug: 'mini-pcs', description: 'Compact desktop computers that save space' },
    de: { title: 'Mini PCs', slug: 'mini-pcs', description: 'Kompakte Desktop-Computer die Platz sparen' },
    fr: { title: 'Mini PC', slug: 'mini-pc', description: 'Ordinateurs de bureau compacts pour gagner de la place' },
  },
  'all-in-ones': {
    en: { title: 'All-in-One PCs', slug: 'all-in-ones', description: 'Complete computer systems with integrated display' },
    de: { title: 'All-in-One PCs', slug: 'all-in-one-pcs', description: 'Komplette Computersysteme mit integriertem Display' },
    fr: { title: 'PC Tout-en-un', slug: 'pc-tout-en-un', description: 'Systemes informatiques complets avec ecran integre' },
  },
  'computer-accessories': {
    en: { title: 'Computer Accessories', slug: 'computer-accessories', description: 'Essential peripherals and accessories' },
    de: { title: 'Computer Zubehoer', slug: 'computer-zubehoer', description: 'Wesentliche Peripheriegeraete und Zubehoer' },
    fr: { title: 'Accessoires Informatiques', slug: 'accessoires-informatiques', description: 'Peripheriques et accessoires essentiels' },
  },
  keyboards: {
    en: { title: 'Keyboards', slug: 'keyboards', description: 'Mechanical and membrane keyboards' },
    de: { title: 'Tastaturen', slug: 'tastaturen', description: 'Mechanische und Membran-Tastaturen' },
    fr: { title: 'Claviers', slug: 'claviers', description: 'Claviers mecaniques et a membrane' },
  },
  mice: {
    en: { title: 'Mice', slug: 'mice', description: 'Gaming and productivity mice' },
    de: { title: 'Maeuse', slug: 'maeuse', description: 'Gaming- und Produktivitaets-Maeuse' },
    fr: { title: 'Souris', slug: 'souris', description: 'Souris gaming et productivite' },
  },
  webcams: {
    en: { title: 'Webcams', slug: 'webcams', description: 'HD webcams for video conferencing' },
    de: { title: 'Webcams', slug: 'webcams', description: 'HD-Webcams fuer Videokonferenzen' },
    fr: { title: 'Webcams', slug: 'webcams', description: 'Webcams HD pour videoconference' },
  },
  'usb-hubs': {
    en: { title: 'USB Hubs', slug: 'usb-hubs', description: 'Expand your connectivity options' },
    de: { title: 'USB Hubs', slug: 'usb-hubs', description: 'Erweitern Sie Ihre Anschlussmoeglichkeiten' },
    fr: { title: 'Hubs USB', slug: 'hubs-usb', description: 'Etendez vos options de connectivite' },
  },
  'laptop-stands': {
    en: { title: 'Laptop Stands', slug: 'laptop-stands', description: 'Ergonomic laptop stands for better posture' },
    de: { title: 'Laptop Staender', slug: 'laptop-staender', description: 'Ergonomische Laptop-Staender fuer bessere Haltung' },
    fr: { title: 'Supports Laptop', slug: 'supports-laptop', description: 'Supports ergonomiques pour une meilleure posture' },
  },
  'docking-stations': {
    en: { title: 'Docking Stations', slug: 'docking-stations', description: 'Connect all your peripherals with ease' },
    de: { title: 'Docking Stations', slug: 'docking-stations', description: 'Verbinden Sie alle Peripheriegeraete einfach' },
    fr: { title: 'Stations dAccueil', slug: 'stations-accueil', description: 'Connectez tous vos peripheriques facilement' },
  },
  'laptop-bags': {
    en: { title: 'Laptop Bags', slug: 'laptop-bags', description: 'Protective bags and backpacks for laptops' },
    de: { title: 'Laptop Taschen', slug: 'laptop-taschen', description: 'Schutztaschen und Rucksaecke fuer Laptops' },
    fr: { title: 'Sacs Laptop', slug: 'sacs-laptop', description: 'Sacs et sacs a dos de protection pour portables' },
  },
  'monitors-displays': {
    en: { title: 'Monitors & Displays', slug: 'monitors-displays', description: 'Computer monitors for every use case' },
    de: { title: 'Monitore & Displays', slug: 'monitore-displays', description: 'Computer-Monitore fuer jeden Anwendungsfall' },
    fr: { title: 'Moniteurs & Ecrans', slug: 'moniteurs-ecrans', description: 'Moniteurs informatiques pour chaque usage' },
  },
  'gaming-monitors': {
    en: { title: 'Gaming Monitors', slug: 'gaming-monitors', description: 'High refresh rate gaming displays' },
    de: { title: 'Gaming Monitore', slug: 'gaming-monitore', description: 'Gaming-Bildschirme mit hoher Bildwiederholrate' },
    fr: { title: 'Ecrans Gaming', slug: 'ecrans-gaming', description: 'Ecrans gaming haute frequence' },
  },
  'professional-monitors': {
    en: { title: 'Professional Monitors', slug: 'professional-monitors', description: 'Color-accurate monitors for professionals' },
    de: { title: 'Professionelle Monitore', slug: 'professionelle-monitore', description: 'Farbgenaue Monitore fuer Profis' },
    fr: { title: 'Moniteurs Professionnels', slug: 'moniteurs-professionnels', description: 'Moniteurs precis en couleurs pour professionnels' },
  },
  'ultrawide-monitors': {
    en: { title: 'Ultrawide Monitors', slug: 'ultrawide-monitors', description: 'Extra-wide screens for immersive viewing' },
    de: { title: 'Ultrawide Monitore', slug: 'ultrawide-monitore', description: 'Extra breite Bildschirme fuer immersives Betrachten' },
    fr: { title: 'Moniteurs Ultrawide', slug: 'moniteurs-ultrawide', description: 'Ecrans extra-larges pour une vue immersive' },
  },
  'portable-monitors': {
    en: { title: 'Portable Monitors', slug: 'portable-monitors', description: 'Take your screen anywhere' },
    de: { title: 'Tragbare Monitore', slug: 'tragbare-monitore', description: 'Nehmen Sie Ihren Bildschirm ueberall mit' },
    fr: { title: 'Moniteurs Portables', slug: 'moniteurs-portables', description: 'Emportez votre ecran partout' },
  },

  // ========================================
  // Smartphones & Tablets
  // ========================================
  'smartphones-tablets': {
    en: { title: 'Smartphones & Tablets', slug: 'smartphones-tablets', description: 'Mobile devices for communication and entertainment' },
    de: { title: 'Smartphones & Tablets', slug: 'smartphones-tablets', description: 'Mobile Geraete fuer Kommunikation und Unterhaltung' },
    fr: { title: 'Smartphones & Tablettes', slug: 'smartphones-tablettes', description: 'Appareils mobiles pour communication et divertissement' },
  },
  smartphones: {
    en: { title: 'Smartphones', slug: 'smartphones', description: 'The latest smartphones from top brands' },
    de: { title: 'Smartphones', slug: 'smartphones', description: 'Die neuesten Smartphones von Top-Marken' },
    fr: { title: 'Smartphones', slug: 'smartphones', description: 'Les derniers smartphones des meilleures marques' },
  },
  'android-phones': {
    en: { title: 'Android Phones', slug: 'android-phones', description: 'Android-powered smartphones' },
    de: { title: 'Android Handys', slug: 'android-handys', description: 'Android-betriebene Smartphones' },
    fr: { title: 'Telephones Android', slug: 'telephones-android', description: 'Smartphones sous Android' },
  },
  iphones: {
    en: { title: 'iPhones', slug: 'iphones', description: 'Apple iPhone smartphones' },
    de: { title: 'iPhones', slug: 'iphones', description: 'Apple iPhone Smartphones' },
    fr: { title: 'iPhones', slug: 'iphones', description: 'Smartphones Apple iPhone' },
  },
  'flagship-phones': {
    en: { title: 'Flagship Phones', slug: 'flagship-phones', description: 'Premium smartphones with cutting-edge features' },
    de: { title: 'Flagship Handys', slug: 'flagship-handys', description: 'Premium-Smartphones mit modernsten Funktionen' },
    fr: { title: 'Telephones Haut de Gamme', slug: 'telephones-haut-gamme', description: 'Smartphones premium avec fonctionnalites de pointe' },
  },
  'budget-phones': {
    en: { title: 'Budget Phones', slug: 'budget-phones', description: 'Affordable smartphones that deliver' },
    de: { title: 'Guenstige Handys', slug: 'guenstige-handys', description: 'Erschwingliche Smartphones die ueberzeugen' },
    fr: { title: 'Telephones Budget', slug: 'telephones-budget', description: 'Smartphones abordables qui tiennent leurs promesses' },
  },
  'rugged-phones': {
    en: { title: 'Rugged Phones', slug: 'rugged-phones', description: 'Tough smartphones for extreme conditions' },
    de: { title: 'Robuste Handys', slug: 'robuste-handys', description: 'Robuste Smartphones fuer extreme Bedingungen' },
    fr: { title: 'Telephones Robustes', slug: 'telephones-robustes', description: 'Smartphones resistants pour conditions extremes' },
  },
  tablets: {
    en: { title: 'Tablets', slug: 'tablets', description: 'Tablets for work and entertainment' },
    de: { title: 'Tablets', slug: 'tablets', description: 'Tablets fuer Arbeit und Unterhaltung' },
    fr: { title: 'Tablettes', slug: 'tablettes', description: 'Tablettes pour le travail et les loisirs' },
  },
  'android-tablets': {
    en: { title: 'Android Tablets', slug: 'android-tablets', description: 'Versatile Android-powered tablets' },
    de: { title: 'Android Tablets', slug: 'android-tablets', description: 'Vielseitige Android-betriebene Tablets' },
    fr: { title: 'Tablettes Android', slug: 'tablettes-android', description: 'Tablettes polyvalentes sous Android' },
  },
  ipads: {
    en: { title: 'iPads', slug: 'ipads', description: 'Apple iPad tablets for every need' },
    de: { title: 'iPads', slug: 'ipads', description: 'Apple iPad Tablets fuer jeden Bedarf' },
    fr: { title: 'iPads', slug: 'ipads', description: 'Tablettes Apple iPad pour tous les besoins' },
  },
  'e-readers': {
    en: { title: 'E-Readers', slug: 'e-readers', description: 'Digital book readers for avid readers' },
    de: { title: 'E-Reader', slug: 'e-reader', description: 'Digitale Buchleser fuer begeisterte Leser' },
    fr: { title: 'Liseuses', slug: 'liseuses', description: 'Liseuses numeriques pour lecteurs avides' },
  },
  'kids-tablets': {
    en: { title: 'Kids Tablets', slug: 'kids-tablets', description: 'Child-friendly tablets with parental controls' },
    de: { title: 'Kinder Tablets', slug: 'kinder-tablets', description: 'Kinderfreundliche Tablets mit Elternkontrolle' },
    fr: { title: 'Tablettes Enfants', slug: 'tablettes-enfants', description: 'Tablettes adaptees aux enfants avec controle parental' },
  },
  'phone-accessories': {
    en: { title: 'Phone Accessories', slug: 'phone-accessories', description: 'Cases, chargers, and more' },
    de: { title: 'Handy Zubehoer', slug: 'handy-zubehoer', description: 'Huellen, Ladegeraete und mehr' },
    fr: { title: 'Accessoires Telephone', slug: 'accessoires-telephone', description: 'Coques, chargeurs et plus' },
  },
  cases: {
    en: { title: 'Phone Cases', slug: 'phone-cases', description: 'Protective cases for smartphones' },
    de: { title: 'Handy Huellen', slug: 'handy-huellen', description: 'Schutzhuellen fuer Smartphones' },
    fr: { title: 'Coques Telephone', slug: 'coques-telephone', description: 'Coques de protection pour smartphones' },
  },
  chargers: {
    en: { title: 'Chargers & Cables', slug: 'chargers-cables', description: 'Fast chargers and quality cables' },
    de: { title: 'Ladegeraete & Kabel', slug: 'ladegeraete-kabel', description: 'Schnellladegeraete und Qualitaetskabel' },
    fr: { title: 'Chargeurs & Cables', slug: 'chargeurs-cables', description: 'Chargeurs rapides et cables de qualite' },
  },
  'screen-protectors': {
    en: { title: 'Screen Protectors', slug: 'screen-protectors', description: 'Tempered glass and film protectors' },
    de: { title: 'Displayschutz', slug: 'displayschutz', description: 'Panzerglas und Schutzfolien' },
    fr: { title: 'Protecteurs Ecran', slug: 'protecteurs-ecran', description: 'Verre trempe et films protecteurs' },
  },
  'power-banks': {
    en: { title: 'Power Banks', slug: 'power-banks', description: 'Portable chargers for on-the-go power' },
    de: { title: 'Powerbanks', slug: 'powerbanks', description: 'Tragbare Ladegeraete fuer unterwegs' },
    fr: { title: 'Batteries Externes', slug: 'batteries-externes', description: 'Chargeurs portables pour energie mobile' },
  },
  'phone-mounts': {
    en: { title: 'Phone Mounts', slug: 'phone-mounts', description: 'Car and desk mounts for smartphones' },
    de: { title: 'Handy Halterungen', slug: 'handy-halterungen', description: 'Auto- und Tischhalterungen fuer Smartphones' },
    fr: { title: 'Supports Telephone', slug: 'supports-telephone', description: 'Supports voiture et bureau pour smartphones' },
  },
  'tablet-accessories': {
    en: { title: 'Tablet Accessories', slug: 'tablet-accessories', description: 'Enhance your tablet experience' },
    de: { title: 'Tablet Zubehoer', slug: 'tablet-zubehoer', description: 'Verbessern Sie Ihr Tablet-Erlebnis' },
    fr: { title: 'Accessoires Tablette', slug: 'accessoires-tablette', description: 'Ameliorez votre experience tablette' },
  },
  'tablet-cases': {
    en: { title: 'Tablet Cases', slug: 'tablet-cases', description: 'Protection for your tablet' },
    de: { title: 'Tablet Huellen', slug: 'tablet-huellen', description: 'Schutz fuer Ihr Tablet' },
    fr: { title: 'Coques Tablette', slug: 'coques-tablette', description: 'Protection pour votre tablette' },
  },
  'stylus-pens': {
    en: { title: 'Stylus Pens', slug: 'stylus-pens', description: 'Digital pens for precision input' },
    de: { title: 'Stylus Stifte', slug: 'stylus-stifte', description: 'Digitale Stifte fuer praezise Eingabe' },
    fr: { title: 'Stylets', slug: 'stylets', description: 'Stylos numeriques pour entree de precision' },
  },
  'tablet-keyboards': {
    en: { title: 'Tablet Keyboards', slug: 'tablet-keyboards', description: 'Turn your tablet into a laptop' },
    de: { title: 'Tablet Tastaturen', slug: 'tablet-tastaturen', description: 'Verwandeln Sie Ihr Tablet in einen Laptop' },
    fr: { title: 'Claviers Tablette', slug: 'claviers-tablette', description: 'Transformez votre tablette en laptop' },
  },

  // ========================================
  // Audio & Video
  // ========================================
  'audio-video': {
    en: { title: 'Audio & Video', slug: 'audio-video', description: 'Headphones, speakers, and home entertainment' },
    de: { title: 'Audio & Video', slug: 'audio-video', description: 'Kopfhoerer, Lautsprecher und Heimunterhaltung' },
    fr: { title: 'Audio & Video', slug: 'audio-video', description: 'Casques, enceintes et divertissement' },
  },
  headphones: {
    en: { title: 'Headphones', slug: 'headphones', description: 'Premium headphones and earbuds' },
    de: { title: 'Kopfhoerer', slug: 'kopfhoerer', description: 'Premium Kopfhoerer und Ohrhoerer' },
    fr: { title: 'Casques Audio', slug: 'casques-audio', description: 'Casques et ecouteurs premium' },
  },
  'wireless-headphones': {
    en: { title: 'Wireless Headphones', slug: 'wireless-headphones', description: 'Bluetooth headphones and earbuds' },
    de: { title: 'Kabellose Kopfhoerer', slug: 'kabellose-kopfhoerer', description: 'Bluetooth Kopfhoerer und Ohrhoerer' },
    fr: { title: 'Casques Sans Fil', slug: 'casques-sans-fil', description: 'Casques et ecouteurs Bluetooth' },
  },
  'wired-headphones': {
    en: { title: 'Wired Headphones', slug: 'wired-headphones', description: 'Studio and hi-fi wired headphones' },
    de: { title: 'Kabelgebundene Kopfhoerer', slug: 'kabelgebundene-kopfhoerer', description: 'Studio und Hi-Fi Kopfhoerer mit Kabel' },
    fr: { title: 'Casques Filaires', slug: 'casques-filaires', description: 'Casques studio et hi-fi filaires' },
  },
  'gaming-headsets': {
    en: { title: 'Gaming Headsets', slug: 'gaming-headsets', description: 'Immersive gaming audio with microphone' },
    de: { title: 'Gaming Headsets', slug: 'gaming-headsets', description: 'Immersiver Gaming-Sound mit Mikrofon' },
    fr: { title: 'Casques Gaming', slug: 'casques-gaming', description: 'Audio gaming immersif avec microphone' },
  },
  'noise-cancelling': {
    en: { title: 'Noise Cancelling', slug: 'noise-cancelling', description: 'Active noise cancellation headphones' },
    de: { title: 'Noise Cancelling', slug: 'noise-cancelling', description: 'Kopfhoerer mit aktiver Gerauschunterdrueckung' },
    fr: { title: 'Reduction de Bruit', slug: 'reduction-bruit', description: 'Casques a reduction de bruit active' },
  },
  earbuds: {
    en: { title: 'Earbuds', slug: 'earbuds', description: 'True wireless and in-ear earbuds' },
    de: { title: 'Earbuds', slug: 'earbuds', description: 'True Wireless und In-Ear Ohrhoerer' },
    fr: { title: 'Ecouteurs', slug: 'ecouteurs', description: 'Ecouteurs true wireless et intra-auriculaires' },
  },
  'sports-headphones': {
    en: { title: 'Sports Headphones', slug: 'sports-headphones', description: 'Sweat-proof headphones for athletes' },
    de: { title: 'Sport Kopfhoerer', slug: 'sport-kopfhoerer', description: 'Schweissfeste Kopfhoerer fuer Sportler' },
    fr: { title: 'Casques Sport', slug: 'casques-sport', description: 'Casques anti-transpiration pour sportifs' },
  },
  speakers: {
    en: { title: 'Speakers', slug: 'speakers', description: 'Portable and home speakers' },
    de: { title: 'Lautsprecher', slug: 'lautsprecher', description: 'Tragbare und Heim-Lautsprecher' },
    fr: { title: 'Enceintes', slug: 'enceintes', description: 'Enceintes portables et domestiques' },
  },
  'bluetooth-speakers': {
    en: { title: 'Bluetooth Speakers', slug: 'bluetooth-speakers', description: 'Wireless Bluetooth speakers' },
    de: { title: 'Bluetooth Lautsprecher', slug: 'bluetooth-lautsprecher', description: 'Kabellose Bluetooth Lautsprecher' },
    fr: { title: 'Enceintes Bluetooth', slug: 'enceintes-bluetooth', description: 'Enceintes sans fil Bluetooth' },
  },
  'smart-speakers': {
    en: { title: 'Smart Speakers', slug: 'smart-speakers', description: 'Voice-controlled smart speakers' },
    de: { title: 'Smart Lautsprecher', slug: 'smart-lautsprecher', description: 'Sprachgesteuerte Smart Lautsprecher' },
    fr: { title: 'Enceintes Intelligentes', slug: 'enceintes-intelligentes', description: 'Enceintes a commande vocale' },
  },
  soundbars: {
    en: { title: 'Soundbars', slug: 'soundbars', description: 'Sleek soundbars for your TV' },
    de: { title: 'Soundbars', slug: 'soundbars', description: 'Elegante Soundbars fuer Ihren Fernseher' },
    fr: { title: 'Barres de Son', slug: 'barres-son', description: 'Barres de son elegantes pour votre TV' },
  },
  'portable-speakers': {
    en: { title: 'Portable Speakers', slug: 'portable-speakers', description: 'Take your music anywhere' },
    de: { title: 'Tragbare Lautsprecher', slug: 'tragbare-lautsprecher', description: 'Nehmen Sie Ihre Musik ueberall mit' },
    fr: { title: 'Enceintes Portables', slug: 'enceintes-portables', description: 'Emportez votre musique partout' },
  },
  'party-speakers': {
    en: { title: 'Party Speakers', slug: 'party-speakers', description: 'High-power speakers for events' },
    de: { title: 'Party Lautsprecher', slug: 'party-lautsprecher', description: 'Hochleistungs-Lautsprecher fuer Events' },
    fr: { title: 'Enceintes de Fete', slug: 'enceintes-fete', description: 'Enceintes haute puissance pour evenements' },
  },
  'home-theater': {
    en: { title: 'Home Theater', slug: 'home-theater', description: 'Soundbars and surround systems' },
    de: { title: 'Heimkino', slug: 'heimkino', description: 'Soundbars und Surround-Systeme' },
    fr: { title: 'Home Cinema', slug: 'home-cinema', description: 'Barres de son et systemes surround' },
  },
  microphones: {
    en: { title: 'Microphones', slug: 'microphones', description: 'Professional microphones for every purpose' },
    de: { title: 'Mikrofone', slug: 'mikrofone', description: 'Professionelle Mikrofone fuer jeden Zweck' },
    fr: { title: 'Microphones', slug: 'microphones', description: 'Microphones professionnels pour tous usages' },
  },
  turntables: {
    en: { title: 'Turntables', slug: 'turntables', description: 'Vinyl record players for audiophiles' },
    de: { title: 'Plattenspieler', slug: 'plattenspieler', description: 'Vinyl-Plattenspieler fuer Audiophile' },
    fr: { title: 'Platines Vinyles', slug: 'platines-vinyles', description: 'Platines vinyles pour audiophiles' },
  },

  // ========================================
  // Wearables
  // ========================================
  wearables: {
    en: { title: 'Wearables', slug: 'wearables', description: 'Smartwatches and fitness trackers' },
    de: { title: 'Wearables', slug: 'wearables', description: 'Smartwatches und Fitness-Tracker' },
    fr: { title: 'Objets Connectes', slug: 'objets-connectes', description: 'Montres connectees et trackers fitness' },
  },
  smartwatches: {
    en: { title: 'Smartwatches', slug: 'smartwatches', description: 'Smart timepieces with advanced features' },
    de: { title: 'Smartwatches', slug: 'smartwatches', description: 'Intelligente Uhren mit erweiterten Funktionen' },
    fr: { title: 'Montres Connectees', slug: 'montres-connectees', description: 'Montres intelligentes avec fonctions avancees' },
  },
  'apple-watch': {
    en: { title: 'Apple Watch', slug: 'apple-watch', description: 'Apple Watch series and accessories' },
    de: { title: 'Apple Watch', slug: 'apple-watch', description: 'Apple Watch Serien und Zubehoer' },
    fr: { title: 'Apple Watch', slug: 'apple-watch', description: 'Series Apple Watch et accessoires' },
  },
  'android-watches': {
    en: { title: 'Android Watches', slug: 'android-watches', description: 'Wear OS and Android smartwatches' },
    de: { title: 'Android Uhren', slug: 'android-uhren', description: 'Wear OS und Android Smartwatches' },
    fr: { title: 'Montres Android', slug: 'montres-android', description: 'Montres connectees Wear OS et Android' },
  },
  'hybrid-watches': {
    en: { title: 'Hybrid Watches', slug: 'hybrid-watches', description: 'Classic looks with smart features' },
    de: { title: 'Hybrid Uhren', slug: 'hybrid-uhren', description: 'Klassisches Aussehen mit smarten Funktionen' },
    fr: { title: 'Montres Hybrides', slug: 'montres-hybrides', description: 'Look classique avec fonctions connectees' },
  },
  'fitness-trackers': {
    en: { title: 'Fitness Trackers', slug: 'fitness-trackers', description: 'Activity and health monitoring bands' },
    de: { title: 'Fitness Tracker', slug: 'fitness-tracker', description: 'Aktivitaets- und Gesundheits-Tracking-Baender' },
    fr: { title: 'Bracelets Fitness', slug: 'bracelets-fitness', description: 'Bracelets de suivi activite et sante' },
  },
  'smart-rings': {
    en: { title: 'Smart Rings', slug: 'smart-rings', description: 'Discreet health and fitness tracking' },
    de: { title: 'Smart Ringe', slug: 'smart-ringe', description: 'Diskretes Gesundheits- und Fitness-Tracking' },
    fr: { title: 'Bagues Connectees', slug: 'bagues-connectees', description: 'Suivi sante et fitness discret' },
  },
  'smart-glasses': {
    en: { title: 'Smart Glasses', slug: 'smart-glasses', description: 'AR-enabled smart eyewear' },
    de: { title: 'Smart Brillen', slug: 'smart-brillen', description: 'AR-faehige smarte Brillen' },
    fr: { title: 'Lunettes Connectees', slug: 'lunettes-connectees', description: 'Lunettes intelligentes avec RA' },
  },

  // ========================================
  // Gaming
  // ========================================
  gaming: {
    en: { title: 'Gaming', slug: 'gaming', description: 'Consoles, accessories, and gaming gear' },
    de: { title: 'Gaming', slug: 'gaming', description: 'Konsolen, Zubehoer und Gaming-Ausruestung' },
    fr: { title: 'Gaming', slug: 'gaming', description: 'Consoles, accessoires et equipement gaming' },
  },
  consoles: {
    en: { title: 'Gaming Consoles', slug: 'gaming-consoles', description: 'Latest gaming consoles' },
    de: { title: 'Spielkonsolen', slug: 'spielkonsolen', description: 'Die neuesten Spielkonsolen' },
    fr: { title: 'Consoles de Jeux', slug: 'consoles-jeux', description: 'Les dernieres consoles de jeux' },
  },
  playstation: {
    en: { title: 'PlayStation', slug: 'playstation', description: 'Sony PlayStation consoles and games' },
    de: { title: 'PlayStation', slug: 'playstation', description: 'Sony PlayStation Konsolen und Spiele' },
    fr: { title: 'PlayStation', slug: 'playstation', description: 'Consoles et jeux Sony PlayStation' },
  },
  xbox: {
    en: { title: 'Xbox', slug: 'xbox', description: 'Microsoft Xbox consoles and games' },
    de: { title: 'Xbox', slug: 'xbox', description: 'Microsoft Xbox Konsolen und Spiele' },
    fr: { title: 'Xbox', slug: 'xbox', description: 'Consoles et jeux Microsoft Xbox' },
  },
  nintendo: {
    en: { title: 'Nintendo', slug: 'nintendo', description: 'Nintendo consoles and games' },
    de: { title: 'Nintendo', slug: 'nintendo', description: 'Nintendo Konsolen und Spiele' },
    fr: { title: 'Nintendo', slug: 'nintendo', description: 'Consoles et jeux Nintendo' },
  },
  'handheld-consoles': {
    en: { title: 'Handheld Consoles', slug: 'handheld-consoles', description: 'Portable gaming devices' },
    de: { title: 'Handheld Konsolen', slug: 'handheld-konsolen', description: 'Tragbare Spielgeraete' },
    fr: { title: 'Consoles Portables', slug: 'consoles-portables', description: 'Appareils de jeu portables' },
  },
  'gaming-accessories': {
    en: { title: 'Gaming Accessories', slug: 'gaming-accessories', description: 'Controllers, stands, and more' },
    de: { title: 'Gaming Zubehoer', slug: 'gaming-zubehoer', description: 'Controller, Staender und mehr' },
    fr: { title: 'Accessoires Gaming', slug: 'accessoires-gaming', description: 'Manettes, supports et plus' },
  },
  controllers: {
    en: { title: 'Controllers', slug: 'controllers', description: 'Game controllers and gamepads' },
    de: { title: 'Controller', slug: 'controller', description: 'Spielcontroller und Gamepads' },
    fr: { title: 'Manettes', slug: 'manettes', description: 'Manettes de jeu et gamepads' },
  },
  'gaming-mice': {
    en: { title: 'Gaming Mice', slug: 'gaming-mice', description: 'High-precision gaming mice' },
    de: { title: 'Gaming Maeuse', slug: 'gaming-maeuse', description: 'Hochpraezise Gaming-Maeuse' },
    fr: { title: 'Souris Gaming', slug: 'souris-gaming', description: 'Souris gaming haute precision' },
  },
  'gaming-keyboards': {
    en: { title: 'Gaming Keyboards', slug: 'gaming-keyboards', description: 'Mechanical gaming keyboards' },
    de: { title: 'Gaming Tastaturen', slug: 'gaming-tastaturen', description: 'Mechanische Gaming-Tastaturen' },
    fr: { title: 'Claviers Gaming', slug: 'claviers-gaming', description: 'Claviers gaming mecaniques' },
  },
  'gaming-chairs': {
    en: { title: 'Gaming Chairs', slug: 'gaming-chairs', description: 'Ergonomic chairs for gamers' },
    de: { title: 'Gaming Stuehle', slug: 'gaming-stuehle', description: 'Ergonomische Stuehle fuer Gamer' },
    fr: { title: 'Chaises Gaming', slug: 'chaises-gaming', description: 'Chaises ergonomiques pour gamers' },
  },
  'gaming-furniture': {
    en: { title: 'Gaming Furniture', slug: 'gaming-furniture', description: 'Desks and furniture for your gaming setup' },
    de: { title: 'Gaming Moebel', slug: 'gaming-moebel', description: 'Tische und Moebel fuer Ihr Gaming-Setup' },
    fr: { title: 'Mobilier Gaming', slug: 'mobilier-gaming', description: 'Bureaux et mobilier pour votre setup gaming' },
  },
  'vr-gaming': {
    en: { title: 'VR Gaming', slug: 'vr-gaming', description: 'Virtual reality headsets and accessories' },
    de: { title: 'VR Gaming', slug: 'vr-gaming', description: 'Virtual Reality Headsets und Zubehoer' },
    fr: { title: 'VR Gaming', slug: 'vr-gaming', description: 'Casques et accessoires de realite virtuelle' },
  },

  // ========================================
  // Home Office
  // ========================================
  'home-office': {
    en: { title: 'Home Office', slug: 'home-office', description: 'Everything for your home workspace' },
    de: { title: 'Home Office', slug: 'home-office', description: 'Alles fuer Ihren Arbeitsplatz zu Hause' },
    fr: { title: 'Bureau a Domicile', slug: 'bureau-domicile', description: 'Tout pour votre espace de travail' },
  },
  printers: {
    en: { title: 'Printers', slug: 'printers', description: 'Inkjet and laser printers' },
    de: { title: 'Drucker', slug: 'drucker', description: 'Tintenstrahl- und Laserdrucker' },
    fr: { title: 'Imprimantes', slug: 'imprimantes', description: 'Imprimantes jet encre et laser' },
  },
  'inkjet-printers': {
    en: { title: 'Inkjet Printers', slug: 'inkjet-printers', description: 'Versatile inkjet printers for home and office' },
    de: { title: 'Tintenstrahldrucker', slug: 'tintenstrahldrucker', description: 'Vielseitige Tintenstrahldrucker fuer Zuhause und Buero' },
    fr: { title: 'Imprimantes Jet dEncre', slug: 'imprimantes-jet-encre', description: 'Imprimantes jet dencre polyvalentes' },
  },
  'laser-printers': {
    en: { title: 'Laser Printers', slug: 'laser-printers', description: 'Fast and efficient laser printing' },
    de: { title: 'Laserdrucker', slug: 'laserdrucker', description: 'Schneller und effizienter Laserdruck' },
    fr: { title: 'Imprimantes Laser', slug: 'imprimantes-laser', description: 'Impression laser rapide et efficace' },
  },
  'photo-printers': {
    en: { title: 'Photo Printers', slug: 'photo-printers', description: 'High-quality photo printing at home' },
    de: { title: 'Fotodrucker', slug: 'fotodrucker', description: 'Hochwertiger Fotodruck zu Hause' },
    fr: { title: 'Imprimantes Photo', slug: 'imprimantes-photo', description: 'Impression photo haute qualite a domicile' },
  },
  'label-printers': {
    en: { title: 'Label Printers', slug: 'label-printers', description: 'Print labels and stickers' },
    de: { title: 'Etikettendrucker', slug: 'etikettendrucker', description: 'Drucken Sie Etiketten und Aufkleber' },
    fr: { title: 'Imprimantes Etiquettes', slug: 'imprimantes-etiquettes', description: 'Imprimez etiquettes et autocollants' },
  },
  routers: {
    en: { title: 'Routers & Networking', slug: 'routers-networking', description: 'WiFi routers and mesh systems' },
    de: { title: 'Router & Netzwerk', slug: 'router-netzwerk', description: 'WLAN-Router und Mesh-Systeme' },
    fr: { title: 'Routeurs & Reseau', slug: 'routeurs-reseau', description: 'Routeurs WiFi et systemes mesh' },
  },
  storage: {
    en: { title: 'Storage Devices', slug: 'storage-devices', description: 'External drives and memory' },
    de: { title: 'Speichergeraete', slug: 'speichergeraete', description: 'Externe Laufwerke und Speicher' },
    fr: { title: 'Stockage', slug: 'stockage', description: 'Disques externes et memoire' },
  },
  'external-drives': {
    en: { title: 'External Drives', slug: 'external-drives', description: 'Portable external hard drives and SSDs' },
    de: { title: 'Externe Festplatten', slug: 'externe-festplatten', description: 'Tragbare externe Festplatten und SSDs' },
    fr: { title: 'Disques Externes', slug: 'disques-externes', description: 'Disques durs externes et SSD portables' },
  },
  'usb-drives': {
    en: { title: 'USB Drives', slug: 'usb-drives', description: 'Flash drives and thumb drives' },
    de: { title: 'USB-Sticks', slug: 'usb-sticks', description: 'USB-Flash-Laufwerke und Sticks' },
    fr: { title: 'Cles USB', slug: 'cles-usb', description: 'Cles USB et lecteurs flash' },
  },
  'memory-cards': {
    en: { title: 'Memory Cards', slug: 'memory-cards', description: 'SD cards and microSD cards' },
    de: { title: 'Speicherkarten', slug: 'speicherkarten', description: 'SD-Karten und microSD-Karten' },
    fr: { title: 'Cartes Memoire', slug: 'cartes-memoire', description: 'Cartes SD et microSD' },
  },
  'nas-systems': {
    en: { title: 'NAS Systems', slug: 'nas-systems', description: 'Network-attached storage solutions' },
    de: { title: 'NAS Systeme', slug: 'nas-systeme', description: 'Netzwerkspeicherloesungen' },
    fr: { title: 'NAS', slug: 'nas', description: 'Solutions de stockage en reseau' },
  },
  'office-accessories': {
    en: { title: 'Office Accessories', slug: 'office-accessories', description: 'Essential office supplies and accessories' },
    de: { title: 'Buerozubehoer', slug: 'buerozubehoer', description: 'Wesentliche Bueroutensilien und Zubehoer' },
    fr: { title: 'Accessoires Bureau', slug: 'accessoires-bureau', description: 'Fournitures et accessoires de bureau essentiels' },
  },
  presentation: {
    en: { title: 'Presentation', slug: 'presentation', description: 'Projectors and presentation tools' },
    de: { title: 'Praesentation', slug: 'praesentation', description: 'Projektoren und Praesentationswerkzeuge' },
    fr: { title: 'Presentation', slug: 'presentation', description: 'Projecteurs et outils de presentation' },
  },

  // ========================================
  // Cameras
  // ========================================
  cameras: {
    en: { title: 'Cameras', slug: 'cameras', description: 'Digital and action cameras' },
    de: { title: 'Kameras', slug: 'kameras', description: 'Digital- und Action-Kameras' },
    fr: { title: 'Appareils Photo', slug: 'appareils-photo', description: 'Appareils photo numeriques et action' },
  },
  'digital-cameras': {
    en: { title: 'Digital Cameras', slug: 'digital-cameras', description: 'DSLR and mirrorless cameras' },
    de: { title: 'Digitalkameras', slug: 'digitalkameras', description: 'Spiegelreflex- und spiegellose Kameras' },
    fr: { title: 'Appareils Numeriques', slug: 'appareils-numeriques', description: 'Reflex et hybrides numeriques' },
  },
  'dslr-cameras': {
    en: { title: 'DSLR Cameras', slug: 'dslr-cameras', description: 'Professional digital SLR cameras' },
    de: { title: 'DSLR Kameras', slug: 'dslr-kameras', description: 'Professionelle digitale Spiegelreflexkameras' },
    fr: { title: 'Reflex Numeriques', slug: 'reflex-numeriques', description: 'Appareils reflex numeriques professionnels' },
  },
  'mirrorless-cameras': {
    en: { title: 'Mirrorless Cameras', slug: 'mirrorless-cameras', description: 'Compact mirrorless system cameras' },
    de: { title: 'Spiegellose Kameras', slug: 'spiegellose-kameras', description: 'Kompakte spiegellose Systemkameras' },
    fr: { title: 'Hybrides', slug: 'hybrides', description: 'Appareils hybrides compacts' },
  },
  'compact-cameras': {
    en: { title: 'Compact Cameras', slug: 'compact-cameras', description: 'Easy-to-use point-and-shoot cameras' },
    de: { title: 'Kompaktkameras', slug: 'kompaktkameras', description: 'Einfach zu bedienende Kompaktkameras' },
    fr: { title: 'Compacts', slug: 'compacts', description: 'Appareils compacts faciles a utiliser' },
  },
  'instant-cameras': {
    en: { title: 'Instant Cameras', slug: 'instant-cameras', description: 'Print photos instantly' },
    de: { title: 'Sofortbildkameras', slug: 'sofortbildkameras', description: 'Drucken Sie Fotos sofort' },
    fr: { title: 'Appareils Instantanes', slug: 'appareils-instantanes', description: 'Imprimez vos photos instantanement' },
  },
  'action-cameras': {
    en: { title: 'Action Cameras', slug: 'action-cameras', description: 'Compact cameras for adventure' },
    de: { title: 'Action Kameras', slug: 'action-kameras', description: 'Kompaktkameras fuer Abenteuer' },
    fr: { title: 'Cameras Action', slug: 'cameras-action', description: 'Cameras compactes pour laventure' },
  },
  'camera-accessories': {
    en: { title: 'Camera Accessories', slug: 'camera-accessories', description: 'Tripods, bags, and lenses' },
    de: { title: 'Kamera Zubehoer', slug: 'kamera-zubehoer', description: 'Stative, Taschen und Objektive' },
    fr: { title: 'Accessoires Photo', slug: 'accessoires-photo', description: 'Trepied, sacs et objectifs' },
  },
  'camera-lenses': {
    en: { title: 'Camera Lenses', slug: 'camera-lenses', description: 'Interchangeable lenses for every shot' },
    de: { title: 'Objektive', slug: 'objektive', description: 'Wechselobjektive fuer jede Aufnahme' },
    fr: { title: 'Objectifs', slug: 'objectifs', description: 'Objectifs interchangeables pour chaque prise' },
  },
  tripods: {
    en: { title: 'Tripods', slug: 'tripods', description: 'Stable support for your camera' },
    de: { title: 'Stative', slug: 'stative', description: 'Stabile Unterstuetzung fuer Ihre Kamera' },
    fr: { title: 'Trepieds', slug: 'trepieds', description: 'Support stable pour votre appareil' },
  },
  'camera-bags': {
    en: { title: 'Camera Bags', slug: 'camera-bags', description: 'Protective bags for your gear' },
    de: { title: 'Kamerataschen', slug: 'kamerataschen', description: 'Schutztaschen fuer Ihre Ausruestung' },
    fr: { title: 'Sacs Photo', slug: 'sacs-photo', description: 'Sacs de protection pour votre equipement' },
  },
  'filters-accessories': {
    en: { title: 'Filters & Accessories', slug: 'filters-accessories', description: 'Lens filters and photo accessories' },
    de: { title: 'Filter & Zubehoer', slug: 'filter-zubehoer', description: 'Objektivfilter und Fotozubehoer' },
    fr: { title: 'Filtres & Accessoires', slug: 'filtres-accessoires', description: 'Filtres objectifs et accessoires photo' },
  },
  drones: {
    en: { title: 'Drones', slug: 'drones', description: 'Aerial photography and recreational drones' },
    de: { title: 'Drohnen', slug: 'drohnen', description: 'Luftaufnahmen und Freizeitdrohnen' },
    fr: { title: 'Drones', slug: 'drones', description: 'Drones pour photographie aerienne et loisirs' },
  },
  'security-cameras': {
    en: { title: 'Security Cameras', slug: 'security-cameras', description: 'Home and business security cameras' },
    de: { title: 'Sicherheitskameras', slug: 'sicherheitskameras', description: 'Sicherheitskameras fuer Zuhause und Geschaeft' },
    fr: { title: 'Cameras de Securite', slug: 'cameras-securite', description: 'Cameras de securite maison et entreprise' },
  },

  // ========================================
  // Smart Home
  // ========================================
  'smart-home': {
    en: { title: 'Smart Home', slug: 'smart-home', description: 'Automate and control your home' },
    de: { title: 'Smart Home', slug: 'smart-home', description: 'Automatisieren und steuern Sie Ihr Zuhause' },
    fr: { title: 'Maison Connectee', slug: 'maison-connectee', description: 'Automatisez et controlez votre maison' },
  },
  'smart-lighting': {
    en: { title: 'Smart Lighting', slug: 'smart-lighting', description: 'Connected light bulbs and systems' },
    de: { title: 'Intelligente Beleuchtung', slug: 'intelligente-beleuchtung', description: 'Vernetzte Gluehbirnen und Systeme' },
    fr: { title: 'Eclairage Connecte', slug: 'eclairage-connecte', description: 'Ampoules et systemes connectes' },
  },
  'smart-security': {
    en: { title: 'Smart Security', slug: 'smart-security', description: 'Connected security systems' },
    de: { title: 'Intelligente Sicherheit', slug: 'intelligente-sicherheit', description: 'Vernetzte Sicherheitssysteme' },
    fr: { title: 'Securite Connectee', slug: 'securite-connectee', description: 'Systemes de securite connectes' },
  },
  'smart-thermostats': {
    en: { title: 'Smart Thermostats', slug: 'smart-thermostats', description: 'Intelligent climate control' },
    de: { title: 'Intelligente Thermostate', slug: 'intelligente-thermostate', description: 'Intelligente Klimasteuerung' },
    fr: { title: 'Thermostats Connectes', slug: 'thermostats-connectes', description: 'Controle climatique intelligent' },
  },
  'smart-plugs': {
    en: { title: 'Smart Plugs', slug: 'smart-plugs', description: 'Control any device remotely' },
    de: { title: 'Intelligente Steckdosen', slug: 'intelligente-steckdosen', description: 'Steuern Sie jedes Geraet aus der Ferne' },
    fr: { title: 'Prises Connectees', slug: 'prises-connectees', description: 'Controlez nimporte quel appareil a distance' },
  },
  'voice-assistants': {
    en: { title: 'Voice Assistants', slug: 'voice-assistants', description: 'Smart speakers with voice control' },
    de: { title: 'Sprachassistenten', slug: 'sprachassistenten', description: 'Smart Lautsprecher mit Sprachsteuerung' },
    fr: { title: 'Assistants Vocaux', slug: 'assistants-vocaux', description: 'Enceintes intelligentes a commande vocale' },
  },

  // ========================================
  // Networking
  // ========================================
  networking: {
    en: { title: 'Networking', slug: 'networking', description: 'Network equipment and connectivity' },
    de: { title: 'Netzwerk', slug: 'netzwerk', description: 'Netzwerkausruestung und Konnektivitaet' },
    fr: { title: 'Reseau', slug: 'reseau', description: 'Equipement reseau et connectivite' },
  },
  'wifi-routers': {
    en: { title: 'WiFi Routers', slug: 'wifi-routers', description: 'High-speed wireless routers' },
    de: { title: 'WLAN Router', slug: 'wlan-router', description: 'Hochgeschwindigkeits-WLAN-Router' },
    fr: { title: 'Routeurs WiFi', slug: 'routeurs-wifi', description: 'Routeurs sans fil haute vitesse' },
  },
  'mesh-systems': {
    en: { title: 'Mesh Systems', slug: 'mesh-systems', description: 'Whole-home WiFi coverage' },
    de: { title: 'Mesh Systeme', slug: 'mesh-systeme', description: 'WLAN-Abdeckung fuer das ganze Haus' },
    fr: { title: 'Systemes Mesh', slug: 'systemes-mesh', description: 'Couverture WiFi pour toute la maison' },
  },
  'network-switches': {
    en: { title: 'Network Switches', slug: 'network-switches', description: 'Ethernet switches for wired networks' },
    de: { title: 'Netzwerk Switches', slug: 'netzwerk-switches', description: 'Ethernet-Switches fuer kabelgebundene Netzwerke' },
    fr: { title: 'Switches Reseau', slug: 'switches-reseau', description: 'Switches Ethernet pour reseaux cables' },
  },
  'network-cables': {
    en: { title: 'Network Cables', slug: 'network-cables', description: 'Ethernet and network cabling' },
    de: { title: 'Netzwerkkabel', slug: 'netzwerkkabel', description: 'Ethernet- und Netzwerkkabel' },
    fr: { title: 'Cables Reseau', slug: 'cables-reseau', description: 'Cables Ethernet et reseau' },
  },
  'access-points': {
    en: { title: 'Access Points', slug: 'access-points', description: 'Extend your wireless network' },
    de: { title: 'Access Points', slug: 'access-points', description: 'Erweitern Sie Ihr drahtloses Netzwerk' },
    fr: { title: 'Points dAcces', slug: 'points-acces', description: 'Etendez votre reseau sans fil' },
  },

  // ========================================
  // Components
  // ========================================
  components: {
    en: { title: 'Components', slug: 'components', description: 'PC components and upgrades' },
    de: { title: 'Komponenten', slug: 'komponenten', description: 'PC-Komponenten und Upgrades' },
    fr: { title: 'Composants', slug: 'composants', description: 'Composants PC et mises a niveau' },
  },
  'graphics-cards': {
    en: { title: 'Graphics Cards', slug: 'graphics-cards', description: 'GPUs for gaming and content creation' },
    de: { title: 'Grafikkarten', slug: 'grafikkarten', description: 'GPUs fuer Gaming und Content-Erstellung' },
    fr: { title: 'Cartes Graphiques', slug: 'cartes-graphiques', description: 'GPUs pour gaming et creation de contenu' },
  },
  processors: {
    en: { title: 'Processors', slug: 'processors', description: 'CPUs from Intel and AMD' },
    de: { title: 'Prozessoren', slug: 'prozessoren', description: 'CPUs von Intel und AMD' },
    fr: { title: 'Processeurs', slug: 'processeurs', description: 'CPUs Intel et AMD' },
  },
  'ram-memory': {
    en: { title: 'RAM Memory', slug: 'ram-memory', description: 'System memory for better performance' },
    de: { title: 'Arbeitsspeicher', slug: 'arbeitsspeicher', description: 'Systemspeicher fuer bessere Leistung' },
    fr: { title: 'Memoire RAM', slug: 'memoire-ram', description: 'Memoire systeme pour meilleures performances' },
  },
  ssds: {
    en: { title: 'SSDs', slug: 'ssds', description: 'Solid-state drives for fast storage' },
    de: { title: 'SSDs', slug: 'ssds', description: 'Solid-State-Laufwerke fuer schnellen Speicher' },
    fr: { title: 'SSD', slug: 'ssd', description: 'Disques SSD pour stockage rapide' },
  },
  'power-supplies': {
    en: { title: 'Power Supplies', slug: 'power-supplies', description: 'PSUs for your PC build' },
    de: { title: 'Netzteile', slug: 'netzteile', description: 'Netzteile fuer Ihren PC' },
    fr: { title: 'Alimentations', slug: 'alimentations', description: 'Alimentations pour votre PC' },
  },
  cooling: {
    en: { title: 'Cooling', slug: 'cooling', description: 'CPU coolers and case fans' },
    de: { title: 'Kuehlung', slug: 'kuehlung', description: 'CPU-Kuehler und Gehaeuseluefter' },
    fr: { title: 'Refroidissement', slug: 'refroidissement', description: 'Refroidisseurs CPU et ventilateurs boitier' },
  },
};

// Filter translations
export const filterTranslations: Record<string, Record<string, FilterTranslation>> = {
  brand: {
    en: { title: 'Brand', subtitle: 'Filter by manufacturer' },
    de: { title: 'Marke', subtitle: 'Nach Hersteller filtern' },
    fr: { title: 'Marque', subtitle: 'Filtrer par fabricant' },
  },
  priceRange: {
    en: { title: 'Price Range', subtitle: 'Filter by price' },
    de: { title: 'Preisbereich', subtitle: 'Nach Preis filtern' },
    fr: { title: 'Gamme de Prix', subtitle: 'Filtrer par prix' },
  },
  inStock: {
    en: { title: 'In Stock', subtitle: 'Show only available items' },
    de: { title: 'Auf Lager', subtitle: 'Nur verfuegbare Artikel anzeigen' },
    fr: { title: 'En Stock', subtitle: 'Afficher uniquement les articles disponibles' },
  },
  rating: {
    en: { title: 'Customer Rating', subtitle: 'Filter by rating' },
    de: { title: 'Kundenbewertung', subtitle: 'Nach Bewertung filtern' },
    fr: { title: 'Avis Clients', subtitle: 'Filtrer par note' },
  },
  color: {
    en: { title: 'Color', subtitle: 'Filter by color' },
    de: { title: 'Farbe', subtitle: 'Nach Farbe filtern' },
    fr: { title: 'Couleur', subtitle: 'Filtrer par couleur' },
  },
  wireless: {
    en: { title: 'Wireless', subtitle: 'Show wireless products' },
    de: { title: 'Kabellos', subtitle: 'Kabellose Produkte anzeigen' },
    fr: { title: 'Sans Fil', subtitle: 'Afficher les produits sans fil' },
  },
  screenSize: {
    en: { title: 'Screen Size', subtitle: 'Filter by display size' },
    de: { title: 'Bildschirmgroesse', subtitle: 'Nach Displaygroesse filtern' },
    fr: { title: 'Taille Ecran', subtitle: 'Filtrer par taille ecran' },
  },
  memory: {
    en: { title: 'Memory / Storage', subtitle: 'Filter by RAM or storage' },
    de: { title: 'Speicher', subtitle: 'Nach RAM oder Speicher filtern' },
    fr: { title: 'Memoire / Stockage', subtitle: 'Filtrer par RAM ou stockage' },
  },
  connectivity: {
    en: { title: 'Connectivity', subtitle: 'Filter by connection type' },
    de: { title: 'Anschluesse', subtitle: 'Nach Anschlusstyp filtern' },
    fr: { title: 'Connectivite', subtitle: 'Filtrer par type de connexion' },
  },
  featured: {
    en: { title: 'Featured', subtitle: 'Show featured products' },
    de: { title: 'Empfohlen', subtitle: 'Empfohlene Produkte anzeigen' },
    fr: { title: 'En Vedette', subtitle: 'Afficher les produits en vedette' },
  },
};

// Filter option translations
export const filterOptionTranslations: Record<string, Record<string, Record<string, string>>> = {
  priceRange: {
    'under-100': { en: 'Under $100', de: 'Unter 100 CHF', fr: 'Moins de 100 CHF' },
    '100-250': { en: '$100 - $250', de: '100 - 250 CHF', fr: '100 - 250 CHF' },
    '250-500': { en: '$250 - $500', de: '250 - 500 CHF', fr: '250 - 500 CHF' },
    '500-1000': { en: '$500 - $1000', de: '500 - 1000 CHF', fr: '500 - 1000 CHF' },
    'over-1000': { en: 'Over $1000', de: 'Ueber 1000 CHF', fr: 'Plus de 1000 CHF' },
  },
  rating: {
    '4-stars-up': { en: '4 Stars & Up', de: '4 Sterne und mehr', fr: '4 etoiles et plus' },
    '3-stars-up': { en: '3 Stars & Up', de: '3 Sterne und mehr', fr: '3 etoiles et plus' },
  },
  color: {
    black: { en: 'Black', de: 'Schwarz', fr: 'Noir' },
    white: { en: 'White', de: 'Weiss', fr: 'Blanc' },
    silver: { en: 'Silver', de: 'Silber', fr: 'Argent' },
    blue: { en: 'Blue', de: 'Blau', fr: 'Bleu' },
    red: { en: 'Red', de: 'Rot', fr: 'Rouge' },
    gold: { en: 'Gold', de: 'Gold', fr: 'Or' },
    green: { en: 'Green', de: 'Gruen', fr: 'Vert' },
    pink: { en: 'Pink', de: 'Rosa', fr: 'Rose' },
  },
  screenSize: {
    'under-6': { en: 'Under 6"', de: 'Unter 6"', fr: 'Moins de 6"' },
    '6-10': { en: '6" - 10"', de: '6" - 10"', fr: '6" - 10"' },
    '10-15': { en: '10" - 15"', de: '10" - 15"', fr: '10" - 15"' },
    '15-17': { en: '15" - 17"', de: '15" - 17"', fr: '15" - 17"' },
    'over-17': { en: 'Over 17"', de: 'Ueber 17"', fr: 'Plus de 17"' },
  },
  memory: {
    '4gb': { en: '4 GB', de: '4 GB', fr: '4 Go' },
    '8gb': { en: '8 GB', de: '8 GB', fr: '8 Go' },
    '16gb': { en: '16 GB', de: '16 GB', fr: '16 Go' },
    '32gb': { en: '32 GB', de: '32 GB', fr: '32 Go' },
    '64gb': { en: '64 GB', de: '64 GB', fr: '64 Go' },
    '128gb': { en: '128 GB', de: '128 GB', fr: '128 Go' },
    '256gb': { en: '256 GB', de: '256 GB', fr: '256 Go' },
    '512gb': { en: '512 GB', de: '512 GB', fr: '512 Go' },
    '1tb': { en: '1 TB', de: '1 TB', fr: '1 To' },
  },
  connectivity: {
    'usb-c': { en: 'USB-C', de: 'USB-C', fr: 'USB-C' },
    'usb-a': { en: 'USB-A', de: 'USB-A', fr: 'USB-A' },
    bluetooth: { en: 'Bluetooth', de: 'Bluetooth', fr: 'Bluetooth' },
    wifi: { en: 'Wi-Fi', de: 'WLAN', fr: 'Wi-Fi' },
    hdmi: { en: 'HDMI', de: 'HDMI', fr: 'HDMI' },
    thunderbolt: { en: 'Thunderbolt', de: 'Thunderbolt', fr: 'Thunderbolt' },
  },
};
