import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';

export interface MetaCatalog {
  id: string;
  name: string;
  product_count: number;
  business: {
    id: string;
    name: string;
  };
  feed_count: number;
  is_catalog_segment: boolean;
  vertical: string;
}

export interface MetaProduct {
  id: string;
  name: string;
  description: string;
  url: string;
  image_url: string;
  availability: string;
  condition: string;
  price: string;
  currency: string;
  brand: string;
  retailer_id: string;
  category: string;
  visibility: string;
}

export interface CreateProductRequest {
  retailer_id: string;
  name: string;
  description: string;
  availability:
    | 'in stock'
    | 'out of stock'
    | 'preorder'
    | 'available for order'
    | 'discontinued';
  condition: 'new' | 'refurbished' | 'used';
  price: string;
  currency: string;
  url: string;
  image_url: string;
  brand?: string;
  category?: string;
  additional_image_urls?: string[];
  custom_data?: Record<string, any>;
}

@Injectable()
export class MetaCatalogService {
  private readonly baseUrl = 'https://graph.facebook.com';
  private readonly version = 'v20.0';

  constructor(private configService: ConfigService) {}

  async getCatalogs(
    accessToken: string,
    businessId?: string,
  ): Promise<MetaCatalog[]> {
    try {
      const endpoint = businessId
        ? `${this.baseUrl}/${this.version}/${businessId}/owned_product_catalogs`
        : `${this.baseUrl}/${this.version}/me/businesses`;

      if (!businessId) {
        const businessResponse = await axios.get(endpoint, {
          params: {
            access_token: accessToken,
            fields: 'id,name',
          },
        });

        const businesses = businessResponse.data.data || [];
        const allCatalogs: MetaCatalog[] = [];
        for (const business of businesses) {
          try {
            const catalogResponse = await axios.get(
              `${this.baseUrl}/${this.version}/${business.id}/owned_product_catalogs`,
              {
                params: {
                  access_token: accessToken,
                  fields:
                    'id,name,product_count,business,feed_count,is_catalog_segment,vertical',
                },
              },
            );
            allCatalogs.push(...(catalogResponse.data.data || []));
          } catch (error) {
            console.warn(
              `Failed to get catalogs for business ${business.id}:`,
              error.message,
            );
          }
        }

        return allCatalogs;
      } else {
        const response = await axios.get(endpoint, {
          params: {
            access_token: accessToken,
            fields:
              'id,name,product_count,business,feed_count,is_catalog_segment,vertical',
          },
        });

        return response.data.data || [];
      }
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to get Meta catalogs: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async getCatalogById(
    catalogId: string,
    accessToken: string,
  ): Promise<MetaCatalog> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.version}/${catalogId}`,
        {
          params: {
            access_token: accessToken,
            fields:
              'id,name,product_count,business,feed_count,is_catalog_segment,vertical',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to get catalog by ID: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  // Get products from a catalog
  async getCatalogProducts(
    catalogId: string,
    accessToken: string,
    limit = 25,
    after?: string,
  ): Promise<{
    products: MetaProduct[];
    paging?: any;
  }> {
    try {
      const params: any = {
        access_token: accessToken,
        fields:
          'id,name,description,url,image_url,availability,condition,price,currency,brand,retailer_id,category,visibility',
        limit,
      };

      if (after) {
        params.after = after;
      }

      const response = await axios.get(
        `${this.baseUrl}/${this.version}/${catalogId}/products`,
        { params },
      );

      return {
        products: response.data.data || [],
        paging: response.data.paging,
      };
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to get catalog products: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  // Create a new product in catalog
  async createProduct(
    catalogId: string,
    productData: CreateProductRequest,
    accessToken: string,
  ): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.version}/${catalogId}/products`,
        {
          retailer_id: productData.retailer_id,
          name: productData.name,
          description: productData.description,
          availability: productData.availability,
          condition: productData.condition,
          price: productData.price,
          currency: productData.currency,
          url: productData.url,
          image_url: productData.image_url,
          brand: productData.brand,
          category: productData.category,
          additional_image_urls: productData.additional_image_urls,
          custom_data: productData.custom_data,
        },
        {
          params: {
            access_token: accessToken,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to create product: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  // Update an existing product
  async updateProduct(
    productId: string,
    productData: Partial<CreateProductRequest>,
    accessToken: string,
  ): Promise<{ success: boolean }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.version}/${productId}`,
        productData,
        {
          params: {
            access_token: accessToken,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to update product: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  // Delete a product
  async deleteProduct(
    productId: string,
    accessToken: string,
  ): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/${this.version}/${productId}`,
        {
          params: {
            access_token: accessToken,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to delete product: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  // Get a specific product by ID
  async getProduct(
    productId: string,
    accessToken: string,
  ): Promise<MetaProduct> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.version}/${productId}`,
        {
          params: {
            access_token: accessToken,
            fields:
              'id,name,description,url,image_url,availability,condition,price,currency,brand,retailer_id,category,visibility',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to get product: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  // Bulk upload products (up to 5000 products)
  async bulkUploadProducts(
    catalogId: string,
    products: CreateProductRequest[],
    accessToken: string,
  ): Promise<{ handle: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.version}/${catalogId}/batch`,
        {
          requests: products.map((product, index) => ({
            method: 'POST',
            relative_url: `${catalogId}/products`,
            body: new URLSearchParams({
              retailer_id: product.retailer_id,
              name: product.name,
              description: product.description,
              availability: product.availability,
              condition: product.condition,
              price: product.price,
              currency: product.currency,
              url: product.url,
              image_url: product.image_url,
              ...(product.brand && { brand: product.brand }),
              ...(product.category && { category: product.category }),
            }).toString(),
          })),
        },
        {
          params: {
            access_token: accessToken,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to bulk upload products: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  // Check batch upload status
  async getBatchStatus(batchHandle: string, accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.version}/${batchHandle}`,
        {
          params: {
            access_token: accessToken,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to get batch status: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  // Search products in catalog
  async searchProducts(
    catalogId: string,
    query: string,
    accessToken: string,
  ): Promise<MetaProduct[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.version}/${catalogId}/products`,
        {
          params: {
            access_token: accessToken,
            fields:
              'id,name,description,url,image_url,availability,condition,price,currency,brand,retailer_id,category,visibility',
            filter: JSON.stringify({
              operator: 'CONTAIN',
              value: query,
              field: 'name',
            }),
          },
        },
      );

      return response.data.data || [];
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to search products: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  // Get catalog insights/analytics
  async getCatalogInsights(
    catalogId: string,
    accessToken: string,
    dateRange?: { since: string; until: string },
  ): Promise<any> {
    try {
      const params: any = {
        access_token: accessToken,
        metric: 'catalog_segment_product_total,catalog_segment_product_count',
      };

      if (dateRange) {
        params.since = dateRange.since;
        params.until = dateRange.until;
      }

      const response = await axios.get(
        `${this.baseUrl}/${this.version}/${catalogId}/insights`,
        { params },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestDomainException(
        `Failed to get catalog insights: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }
}
