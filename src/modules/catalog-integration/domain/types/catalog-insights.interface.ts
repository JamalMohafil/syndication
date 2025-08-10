// catalog-insights.interface.ts

export interface CatalogInfo {
  id: string;
  name: string;
  vertical: string;
  total_products: number;
}

export interface AvailabilityBreakdown {
  in_stock: number;
  out_of_stock: number;
  preorder: number;
  discontinued: number;
}

export interface ConditionBreakdown {
  new: number;
  refurbished: number;
  used: number;
}

export interface PriceAnalysis {
  min: number;
  max: number;
  average: number;
}

export interface TopBrand {
  brand: string;
  count: number;
}

export interface TopCategory {
  category: string;
  count: number;
}

export interface ProductStatistics {
  total_products: number;
  brands_count: number;
  categories_count: number;
  currencies: string[];
  availability_breakdown: AvailabilityBreakdown;
  condition_breakdown: ConditionBreakdown;
  price_analysis: PriceAnalysis;
  top_brands: TopBrand[];
  top_categories: TopCategory[];
}

export interface ProductSet {
  id: string;
  name: string;
  product_count: number;
  filter?: any;
}

export interface ProductSetsSummary {
  total_sets: number;
  sets: ProductSet[];
}

export interface ProductFeed {
  id: string;
  name: string;
  product_count?: number;
  schedule?: string;
  country?: string;
  file_name?: string;
}

export interface ProductFeedsSummary {
  total_feeds: number;
  feeds: ProductFeed[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  brand?: string;
  category?: string;
  price: string;
  currency: string;
  availability: string;
  condition: string;
  image_url: string;
  url: string;
  retailer_id: string;
}

export interface DetailedProducts {
  count: number;
  sample: Product[];
  has_more: boolean;
}

export interface CatalogHealth {
  products_with_images: number;
  products_with_descriptions: number;
  products_with_brands: number;
  products_with_categories: number;
  products_in_stock: number;
}

export interface Summary {
  catalog_health: CatalogHealth;
  completion_rate: number;
}

export interface ApiError {
  endpoint: string;
  error: string;
}

export interface Metadata {
  generated_at: string;
  api_version: string;
  date_range: { since: string; until: string } | null;
  errors: ApiError[];
}

export interface CatalogInsightsInterface {
  catalog_info: CatalogInfo;
  product_statistics: ProductStatistics;
  product_sets_summary: ProductSetsSummary;
  product_feeds_summary: ProductFeedsSummary;
  detailed_products: DetailedProducts;
  summary: Summary;
  metadata: Metadata;
}
