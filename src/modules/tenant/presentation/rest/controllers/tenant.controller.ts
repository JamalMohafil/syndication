import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { TenantResponse } from '../responses/tenant.response';
import { TenantService } from 'src/modules/tenant/application/services/tenant.service';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: TenantResponse,
  })
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
  ): Promise<TenantResponse> {
    const tenant = await this.tenantService.createTenant(
      createTenantDto.name,
      createTenantDto.email,
      createTenantDto.defaultLanguage,
      createTenantDto.defaultCurrency,
      createTenantDto.timezone,
    );
    console.log(tenant);
    return tenant.toJSON() as TenantResponse;
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({
    status: 200,
    description: 'List of all tenants',
    type: [TenantResponse],
  })
  async getAllTenants(): Promise<TenantResponse[]> {
    const tenants = await this.tenantService.getAllTenants();
    return tenants.map((tenant) => tenant.toJSON() as TenantResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant details',
    type: TenantResponse,
  })
  async getTenantById(@Param('id') id: string): Promise<TenantResponse> {
    const tenant = await this.tenantService.getTenantById(id);
    return tenant.toJSON() as TenantResponse;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tenant' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: TenantResponse,
  })
  async updateTenant(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponse> {
    const tenant = await this.tenantService.updateTenant(id, updateTenantDto);
    return tenant.toJSON() as TenantResponse;
  }

  @Put(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate tenant' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  async activateTenant(@Param('id') id: string): Promise<TenantResponse> {
    const tenant = await this.tenantService.activateTenant(id);
    return tenant.toJSON() as TenantResponse;
  }

  @Put(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate tenant' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  async deactivateTenant(@Param('id') id: string): Promise<TenantResponse> {
    const tenant = await this.tenantService.deactivateTenant(id);
    return tenant.toJSON() as TenantResponse;
  }
}
