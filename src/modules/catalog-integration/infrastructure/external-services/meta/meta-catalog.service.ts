import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { META_ACCESS_TOKEN } from 'src/modules/catalog-integration/presentation/controllers/meta.controller';
import { CreateMetaCatalogDto } from 'src/modules/catalog-integration/presentation/dto/create-meta-catalog.dto';
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
  private readonly version = 'v23.0';

  constructor(private configService: ConfigService) {}

  async createCatalog(
    businessId: string,
    catalogData: CreateMetaCatalogDto,
    accessToken: string,
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}/${this.version}/${businessId}/owned_product_catalogs?access_token=${accessToken}`;

      const requestData = {
        name: catalogData.name,
        vertical: catalogData.vertical || 'offline_commerce',
        ...(catalogData.feed_count_limit && {
          feed_count_limit: catalogData.feed_count_limit,
        }),
        ...(catalogData.item_count_limit && {
          item_count_limit: catalogData.item_count_limit,
        }),
      };

      const response = await axios.post(url, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Meta API error:', error.response?.data || error.message);
      throw new BadRequestDomainException(
        `Failed to create catalog: ${error.response?.data || error.message}`,
      );
    }
  }
  async getCatalogs(
    accessToken: string,
    businessId?: string,
  ): Promise<MetaCatalog[]> {
    console.log('Url asd', `${this.baseUrl}/${this.version}/${businessId}?`);
    try {
      if (!businessId) {
        const businessResponse = await axios.get(
          `${this.baseUrl}/${this.version}/me/businesses`,
          {
            params: {
              access_token: accessToken,
              fields:
                'id,name,owned_product_catalogs{id,name,product_count,business,feed_count,is_catalog_segment,vertical}',
            },
          },
        );

        const businesses = businessResponse.data.data || [];
        const allCatalogs: MetaCatalog[] = [];

        for (const business of businesses) {
          if (
            business.owned_product_catalogs &&
            business.owned_product_catalogs.data
          ) {
            allCatalogs.push(...business.owned_product_catalogs.data);
          }
        }

        return allCatalogs;
      } else {
        const businessResponse: any = await axios.get(
          `${this.baseUrl}/${this.version}/${businessId}`,
          {
            params: {
              fields: 'owned_product_catalogs',
              access_token: accessToken,
            },
          },
        );

        console.log(businessResponse.data);

        if (
          !businessResponse.data.id ||
          businessResponse.data.id !== businessId ||
          !businessResponse.data.owned_product_catalogs ||
          !businessResponse.data.owned_product_catalogs.data ||
          businessResponse.data.owned_product_catalogs.data.length === 0
        ) {
          throw new BadRequestDomainException(
            `Business ID "${businessId}" is invalid or not found`,
          );
        }

        return businessResponse.data.owned_product_catalogs.data;
      }
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        throw new BadRequestDomainException(
          `Business ID "${businessId}" is invalid or not found`,
        );
      }

      if (error instanceof BadRequestDomainException) {
        throw error;
      }

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
