import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { META_ACCESS_TOKEN } from 'src/modules/catalog-integration/presentation/controllers/meta.controller';
import { CreateMetaCatalogDto } from 'src/modules/catalog-integration/presentation/dto/create-meta-catalog.dto';
import { CreateProductDto } from 'src/modules/catalog-integration/presentation/dto/create-meta-product.dto';
import { UpdateMetaCatalogDto } from 'src/modules/catalog-integration/presentation/dto/update-meta-catalog.dto';
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
  async deleteCatalog(
    accessToken: string,
    catalogId: string,
  ): Promise<{ success: boolean; message: string }> {
    console.log(`${this.baseUrl}/${this.version}/${catalogId}`);
    try {
      const response = await axios.delete(
        `${this.baseUrl}/${this.version}/${catalogId}`,
        {
          params: {
            access_token: accessToken,
          },
        },
      );

      console.log('Delete response:', response.data);

      if (response.data.success) {
        return {
          success: true,
          message: `Catalog ${catalogId} deleted successfully`,
        };
      } else {
        throw new BadRequestDomainException(
          `Failed to delete catalog ${catalogId}`,
        );
      }
    } catch (error) {
      console.error('Error deleting catalog:', error);

      if (error.response?.status === 404) {
        throw new BadRequestDomainException(
          `Catalog ID "${catalogId}" not found`,
        );
      }

      if (error.response?.status === 403) {
        throw new BadRequestDomainException(
          `No permission to delete catalog "${catalogId}"`,
        );
      }

      if (error.response?.status === 400) {
        throw new BadRequestDomainException(
          `Invalid catalog ID "${catalogId}"`,
        );
      }

      if (error instanceof BadRequestDomainException) {
        throw error;
      }

      throw new BadRequestDomainException(
        `Failed to delete catalog: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }
  async updateCatalog(
    accessToken: string,
    catalogId: string,
    catalogData: UpdateMetaCatalogDto,
  ): Promise<{ success: boolean; message: string; catalog?: MetaCatalog }> {
    console.log('Updating catalog with ID:', catalogId, 'Data:', catalogData);

    try {
      const updatePayload: any = {};

      if (catalogData.name !== undefined && catalogData.name.trim() !== '') {
        updatePayload.name = catalogData.name.trim();
      }

      if (catalogData.vertical !== undefined) {
        updatePayload.vertical = catalogData.vertical;
      }

      if (Object.keys(updatePayload).length === 0) {
        throw new BadRequestDomainException('No valid update data provided');
      }

      const response = await axios.post(
        `${this.baseUrl}/${this.version}/${catalogId}`,
        updatePayload,
        {
          params: {
            access_token: accessToken,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.success) {
        try {
          const updatedCatalog = await this.getCatalogById(
            accessToken,
            catalogId,
          );
          return {
            success: true,
            message: `Catalog ${catalogId} updated successfully`,
            catalog: updatedCatalog,
          };
        } catch (fetchError) {
          console.warn('Failed to fetch updated catalog data:', fetchError);
          return {
            success: true,
            message: `Catalog ${catalogId} updated successfully`,
          };
        }
      } else {
        throw new BadRequestDomainException(
          `Failed to update catalog ${catalogId}`,
        );
      }
    } catch (error) {
      console.error('Error updating catalog:', error);

      if (error.response?.status === 404) {
        throw new BadRequestDomainException(
          `Catalog ID "${catalogId}" not found`,
        );
      }

      if (error.response?.status === 403) {
        throw new BadRequestDomainException(
          `No permission to update catalog "${catalogId}"`,
        );
      }

      if (error.response?.status === 400) {
        const errorMessage =
          error.response?.data?.error?.message || 'Invalid request data';
        throw new BadRequestDomainException(
          `Failed to update catalog "${catalogId}": ${errorMessage}`,
        );
      }

      if (error.response?.status === 429) {
        throw new BadRequestDomainException(
          'Rate limit exceeded. Please try again later',
        );
      }

      if (error instanceof BadRequestDomainException) {
        throw error;
      }

      throw new BadRequestDomainException(
        `Failed to update catalog: ${error.response?.data?.error?.message || error.message}`,
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
    productData: CreateProductDto,
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

  async checkProductExists(
    catalogId: string,
    retailerId: string,
    accessToken: string,
  ): Promise<{ exists: boolean; product?: any; error?: string }> {
    try {
      let nextPage = `${this.baseUrl}/${this.version}/${catalogId}/products`;

      do {
        const response = await axios.get(nextPage, {
          params:
            nextPage === `${this.baseUrl}/${this.version}/${catalogId}/products`
              ? {
                  access_token: accessToken,
                  fields: 'id,retailer_id,name,price,availability',
                  limit: 100,
                }
              : { access_token: accessToken },
        });

        const products = response.data?.data || [];

        // البحث عن المنتج في هذه الصفحة
        const foundProduct = products.find(
          (product) => product.retailer_id === retailerId,
        );

        if (foundProduct) {
          return {
            exists: true,
            product: foundProduct,
          };
        }

        // الانتقال للصفحة التالية إذا كانت موجودة
        nextPage = response.data?.paging?.next || null;
      } while (nextPage);

      return {
        exists: false,
        error: 'المنتج غير موجود في الكتالوج',
      };
    } catch (error) {
      let errorMessage = 'خطأ غير محدد';

      if (error.response) {
        const status = error.response.status;
        const fbError = error.response.data?.error;

        switch (status) {
          case 400:
            errorMessage = 'معاملات خاطئة في الطلب';
            break;
          case 401:
            errorMessage = 'مشكلة في الصلاحيات أو Access Token';
            break;
          case 403:
            errorMessage = 'ليس لديك صلاحية للوصول لهذا الكتالوج';
            break;
          case 404:
            errorMessage = 'الكتالوج غير موجود';
            break;
          default:
            errorMessage = fbError?.message || `خطأ HTTP: ${status}`;
        }
      }

      return {
        exists: false,
        error: errorMessage,
      };
    }
  }

  async updateProduct(
    productId: string,
    productData: Partial<CreateProductDto>,
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
    products: CreateProductDto[],
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
              price: Number(product.price).toFixed(2),
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
