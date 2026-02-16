export type BulkPricingTier = {
  label: string;
  range: string;
  unitPrice: number;
  isRFQ?: boolean;
};

export type ShopProduct = {
  id: number;
  name: string;
  category: string;
  image: string;
  images: string[];
  description: string;
  colors: string[];
  sizes: string[];
  bulkPricing: BulkPricingTier[];
  inStock: boolean;
};

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 1,
    name: 'Premium Cotton T-Shirt',
    category: 'T-Shirts',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      'https://images.unsplash.com/photo-1622445275576-721325763afe?w=800',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800',
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800',
    ],
    description: 'Soft combed cotton with a structured fit and smooth finish.',
    colors: ['White', 'Black', 'Navy', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    bulkPricing: [
      { label: 'Standard', range: '10-50 units', unitPrice: 299 },
      { label: 'Silver', range: '50-200 units', unitPrice: 259 },
      { label: 'Gold', range: '200-500 units', unitPrice: 239 },
      { label: 'Diamond', range: '500+ units', unitPrice: 0, isRFQ: true },
    ],
    inStock: true,
  },
  {
    id: 2,
    name: 'Classic Polo Shirt',
    category: 'Polo',
    image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800',
    images: [
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800',
      'https://images.unsplash.com/photo-1625910513413-5fc421e0fd6d?w=800',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=800',
      'https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=800',
    ],
    description: 'Clean pique knit polo with a premium collar and durable stitching.',
    colors: ['White', 'Black', 'Red', 'Blue'],
    sizes: ['S', 'M', 'L', 'XL'],
    bulkPricing: [
      { label: 'Standard', range: '10-50 units', unitPrice: 429 },
      { label: 'Silver', range: '50-200 units', unitPrice: 389 },
      { label: 'Gold', range: '200-500 units', unitPrice: 369 },
      { label: 'Diamond', range: '500+ units', unitPrice: 0, isRFQ: true },
    ],
    inStock: true,
  },
  {
    id: 3,
    name: 'Oversized Hoodie',
    category: 'Hoodies',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
      'https://images.unsplash.com/photo-1578768079470-4cf531ea4d50?w=800',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
      'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800',
    ],
    description: 'Heavyweight fleece hoodie with a relaxed silhouette.',
    colors: ['Black', 'Gray', 'Navy', 'Maroon'],
    sizes: ['M', 'L', 'XL', 'XXL'],
    bulkPricing: [
      { label: 'Standard', range: '10-50 units', unitPrice: 899 },
      { label: 'Silver', range: '50-200 units', unitPrice: 829 },
      { label: 'Gold', range: '200-500 units', unitPrice: 789 },
      { label: 'Diamond', range: '500+ units', unitPrice: 0, isRFQ: true },
    ],
    inStock: true,
  },
  {
    id: 4,
    name: 'Crew Neck Sweatshirt',
    category: 'Sweatshirts',
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800',
    images: [
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800',
      'https://images.unsplash.com/photo-1618354691551-44de113f0164?w=800',
      'https://images.unsplash.com/photo-1572495532056-8583af1cbae0?w=800',
      'https://images.unsplash.com/photo-1614975059251-992f11792571?w=800',
    ],
    description: 'Midweight sweatshirt with ribbed cuffs and hem.',
    colors: ['White', 'Black', 'Gray', 'Olive'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    bulkPricing: [
      { label: 'Standard', range: '10-50 units', unitPrice: 699 },
      { label: 'Silver', range: '50-200 units', unitPrice: 639 },
      { label: 'Gold', range: '200-500 units', unitPrice: 599 },
      { label: 'Diamond', range: '500+ units', unitPrice: 0, isRFQ: true },
    ],
    inStock: true,
  },
  {
    id: 5,
    name: 'Athletic Track Pants',
    category: 'Pants',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
      'https://images.unsplash.com/photo-1584865288642-0f8f5f99e900?w=800',
    ],
    description: 'Tapered fit track pants with breathable stretch fabric.',
    colors: ['Black', 'Navy', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    bulkPricing: [
      { label: 'Standard', range: '10-50 units', unitPrice: 649 },
      { label: 'Silver', range: '50-200 units', unitPrice: 589 },
      { label: 'Gold', range: '200-500 units', unitPrice: 559 },
      { label: 'Diamond', range: '500+ units', unitPrice: 0, isRFQ: true },
    ],
    inStock: true,
  },
  {
    id: 6,
    name: 'Denim Jacket',
    category: 'Jackets',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800',
    images: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800',
      'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800',
      'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=800',
      'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800',
    ],
    description: 'Structured denim jacket with durable buttons and lining.',
    colors: ['Blue', 'Black', 'Light Blue'],
    sizes: ['S', 'M', 'L', 'XL'],
    bulkPricing: [
      { label: 'Standard', range: '10-50 units', unitPrice: 1299 },
      { label: 'Silver', range: '50-200 units', unitPrice: 1199 },
      { label: 'Gold', range: '200-500 units', unitPrice: 1149 },
      { label: 'Diamond', range: '500+ units', unitPrice: 0, isRFQ: true },
    ],
    inStock: true,
  },
  {
    id: 7,
    name: 'Graphic Print T-Shirt',
    category: 'T-Shirts',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
      'https://images.unsplash.com/photo-1523381294911-8d3cead13b03?w=800',
    ],
    description: 'Vibrant prints on a smooth cotton base with clean seams.',
    colors: ['White', 'Black', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    bulkPricing: [
      { label: 'Standard', range: '10-50 units', unitPrice: 319 },
      { label: 'Silver', range: '50-200 units', unitPrice: 279 },
      { label: 'Gold', range: '200-500 units', unitPrice: 259 },
      { label: 'Diamond', range: '500+ units', unitPrice: 0, isRFQ: true },
    ],
    inStock: true,
  },
  {
    id: 8,
    name: 'Zip-Up Hoodie',
    category: 'Hoodies',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
    images: [
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
      'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=800',
      'https://images.unsplash.com/photo-1542406775-ade58c52d2e4?w=800',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
    ],
    description: 'Zip hoodie with brushed fleece interior and premium zipper.',
    colors: ['Black', 'Gray', 'Navy', 'Red'],
    sizes: ['M', 'L', 'XL', 'XXL'],
    bulkPricing: [
      { label: 'Standard', range: '10-50 units', unitPrice: 949 },
      { label: 'Silver', range: '50-200 units', unitPrice: 879 },
      { label: 'Gold', range: '200-500 units', unitPrice: 839 },
      { label: 'Diamond', range: '500+ units', unitPrice: 0, isRFQ: true },
    ],
    inStock: false,
  },
  {
    id: 9,
    name: 'Cotton Shorts',
    category: 'Shorts',
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800',
    images: [
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800',
      'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800',
      'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800',
      'https://images.unsplash.com/photo-1598522325074-042db73aa4e6?w=800',
    ],
    description: 'Lightweight cotton shorts with an easy everyday fit.',
    colors: ['Black', 'Navy', 'Khaki', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL'],
    bulkPricing: [
      { label: 'Standard', range: '10-50 units', unitPrice: 399 },
      { label: 'Silver', range: '50-200 units', unitPrice: 359 },
      { label: 'Gold', range: '200-500 units', unitPrice: 339 },
      { label: 'Diamond', range: '500+ units', unitPrice: 0, isRFQ: true },
    ],
    inStock: true,
  },
  {
    id: 10,
    name: 'Long Sleeve Tee',
    category: 'T-Shirts',
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
    images: [
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
      'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=800',
      'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800',
    ],
    description: 'Long sleeve tee with clean stitching and soft hand feel.',
    colors: ['White', 'Black', 'Gray', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    bulkPricing: [
      { label: 'Standard', range: '10-50 units', unitPrice: 349 },
      { label: 'Silver', range: '50-200 units', unitPrice: 309 },
      { label: 'Gold', range: '200-500 units', unitPrice: 289 },
      { label: 'Diamond', range: '500+ units', unitPrice: 0, isRFQ: true },
    ],
    inStock: true,
  },
  {
    id: 11,
    name: 'Bomber Jacket',
    category: 'Jackets',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800',
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800',
      'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800',
    ],
    description: 'Classic bomber with a smooth finish and tailored fit.',
    colors: ['Black', 'Olive', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL'],
    bulkPricing: [
      { label: 'Standard', range: '10-50 units', unitPrice: 1499 },
      { label: 'Silver', range: '50-200 units', unitPrice: 1399 },
      { label: 'Gold', range: '200-500 units', unitPrice: 1349 },
      { label: 'Diamond', range: '500+ units', unitPrice: 0, isRFQ: true },
    ],
    inStock: true,
  },
  {
    id: 12,
    name: 'Performance Polo',
    category: 'Polo',
    image: 'https://images.unsplash.com/photo-1625910513413-5fc421e0fd6d?w=800',
    images: [
      'https://images.unsplash.com/photo-1625910513413-5fc421e0fd6d?w=800',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
      'https://images.unsplash.com/photo-1571455786673-9d9d6c194f90?w=800',
      'https://images.unsplash.com/photo-1618886614638-80e3c103d31a?w=800',
    ],
    description: 'Moisture-wicking polo for all-day comfort and performance.',
    colors: ['White', 'Black', 'Blue', 'Red'],
    sizes: ['S', 'M', 'L', 'XL'],
    bulkPricing: [
      { label: 'Standard', range: '10-50 units', unitPrice: 479 },
      { label: 'Silver', range: '50-200 units', unitPrice: 439 },
      { label: 'Gold', range: '200-500 units', unitPrice: 419 },
      { label: 'Diamond', range: '500+ units', unitPrice: 0, isRFQ: true },
    ],
    inStock: true,
  },
];
