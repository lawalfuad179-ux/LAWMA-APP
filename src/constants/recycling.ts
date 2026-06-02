export type RecyclingCategory = 'home' | 'markets' | 'businesses' | 'illegal_dumping';

export type RecyclingEntry = {
  id: string;
  category: RecyclingCategory;
  title: string;
  description: string;
  icon: string;
  tags: string[];
};

export const RECYCLING_CATEGORIES: { value: RecyclingCategory; label: string; icon: string }[] = [
  { value: 'home', label: 'Home', icon: '🏠' },
  { value: 'markets', label: 'Markets', icon: '🛒' },
  { value: 'businesses', label: 'Businesses', icon: '🏢' },
  { value: 'illegal_dumping', label: 'Illegal Dumping', icon: '🚫' },
];

export const RECYCLING_ENTRIES: RecyclingEntry[] = [
  // Home
  {
    id: 'home-plastics',
    category: 'home',
    title: 'Plastic Bottles & Sachets',
    description: 'Rinse and crush PET bottles. Remove caps and labels. Collect pure water sachets separately. Drop at designated collection points.',
    icon: '🥤',
    tags: ['plastic', 'bottles', 'PET', 'sachet', 'water'],
  },
  {
    id: 'home-paper',
    category: 'home',
    title: 'Paper & Cardboard',
    description: 'Flatten cardboard boxes. Keep dry and clean. Separate newspapers and magazines. Do not mix with food waste.',
    icon: '📦',
    tags: ['paper', 'cardboard', 'newspaper', 'magazine'],
  },
  {
    id: 'home-organic',
    category: 'home',
    title: 'Food & Organic Waste',
    description: 'Food scraps and peels can be composted. Keep separate from plastics. Use a dedicated bin or bag for organic waste.',
    icon: '🍌',
    tags: ['food', 'organic', 'compost', 'peels', 'scraps'],
  },
  {
    id: 'home-cans',
    category: 'home',
    title: 'Cans & Metal',
    description: 'Rinse aluminum cans. Crush to save space. Separate from general waste. Metal scrap can be sold to scrap dealers.',
    icon: '🥫',
    tags: ['cans', 'aluminum', 'metal', 'tin'],
  },
  {
    id: 'home-ewaste',
    category: 'home',
    title: 'Electronics & Batteries',
    description: 'Do not dispose of batteries, phones, or electronics in general waste. Take to dedicated e-waste collection points.',
    icon: '🔋',
    tags: ['electronics', 'batteries', 'phone', 'e-waste'],
  },
  {
    id: 'home-glass',
    category: 'home',
    title: 'Glass Bottles',
    description: 'Rinse and separate glass bottles. Handle with care. Do not mix broken glass with general waste.',
    icon: '🍾',
    tags: ['glass', 'bottles'],
  },

  // Markets
  {
    id: 'market-organic',
    category: 'markets',
    title: 'Market Perishables',
    description: 'Spoiled fruits, vegetables, and food items should be separated from plastics and packaging. Compost where possible.',
    icon: '🥬',
    tags: ['market', 'perishables', 'fruit', 'vegetables', 'compost'],
  },
  {
    id: 'market-packaging',
    category: 'markets',
    title: 'Packaging & Nylon',
    description: 'Collect nylon bags and packaging separately. Do not burn. Bundle and drop at collection points for recycling.',
    icon: '🛍️',
    tags: ['nylon', 'bags', 'packaging', 'market'],
  },
  {
    id: 'market-bin-usage',
    category: 'markets',
    title: 'Shared Bin Usage',
    description: 'Use designated market bins. Do not overflow bins. Report full bins through the LAWMA app. Keep your stall area clean.',
    icon: '🗑️',
    tags: ['bins', 'shared', 'stall', 'market'],
  },

  // Businesses
  {
    id: 'business-office',
    category: 'businesses',
    title: 'Office Paper & Toner',
    description: 'Recycle used paper, envelopes, and cardboard. Collect used toner cartridges separately. Contact certified e-waste handlers.',
    icon: '🖨️',
    tags: ['office', 'paper', 'toner', 'business'],
  },
  {
    id: 'business-food',
    category: 'businesses',
    title: 'Restaurant & Food Waste',
    description: 'Separate food waste from packaging. Use designated waste bins. Arrange regular collection with your PSP operator.',
    icon: '🍽️',
    tags: ['restaurant', 'food', 'waste', 'business'],
  },
  {
    id: 'business-construction',
    category: 'businesses',
    title: 'Construction Debris',
    description: 'Construction waste requires special disposal. Do not mix with household waste. Contact LAWMA for bulk waste collection.',
    icon: '🏗️',
    tags: ['construction', 'debris', 'bulk', 'business'],
  },

  // Illegal Dumping
  {
    id: 'dumping-report',
    category: 'illegal_dumping',
    title: 'How to Report Dumping',
    description: 'Take a photo. Capture the GPS location. Report through the LAWMA app with the exact address. Your report helps keep Lagos clean.',
    icon: '📸',
    tags: ['report', 'dumping', 'photo', 'GPS'],
  },
  {
    id: 'dumping-drainage',
    category: 'illegal_dumping',
    title: 'Drainage & Waterway Dumping',
    description: 'Dumping in drainage channels and waterways causes flooding. Report immediately. Every blocked drain puts homes at risk.',
    icon: '🌊',
    tags: ['drainage', 'waterway', 'flooding', 'report'],
  },
  {
    id: 'dumping-why-recycle',
    category: 'illegal_dumping',
    title: 'Why Proper Disposal Matters',
    description: 'Recycling reduces landfill waste, creates jobs, and keeps Lagos waterways clean. Every bottle diverted from a drainage helps prevent flooding.',
    icon: '♻️',
    tags: ['recycling', 'environment', 'jobs', 'flooding'],
  },
];
