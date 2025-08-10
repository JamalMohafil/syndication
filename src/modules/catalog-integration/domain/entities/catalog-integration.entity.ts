import { BaseEntity } from '../../../../shared/domain/entities/base.entity';
import { PlatformType } from '../enums/platform-type.enum';
import { IntegrationStatus } from '../enums/integration-status.enum';

export interface CatalogIntegrationProps {
  id?: string;
  tenantId: string;
  platform: PlatformType;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  externalId: string;
  platformConfigs?: Record<string, any>;
  status: IntegrationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CatalogIntegrationEntity extends BaseEntity {
  private _tenantId: string;
  private _platform: PlatformType;
  private _accessToken: string;
  private _refreshToken?: string;
  private _tokenExpiresAt?: Date;
  private _externalId: string;
  private _platformConfigs?: Record<string, any>;
  private _status: IntegrationStatus;

  constructor(
    params: CatalogIntegrationProps,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._tenantId = params.tenantId;
    this._platform = params.platform;
    this._accessToken = params.accessToken;
    this._refreshToken = params.refreshToken;
    this._tokenExpiresAt = params.tokenExpiresAt;
    this._externalId = params.externalId;
    this._platformConfigs = params.platformConfigs ?? {};
    this._status = params.status;
  }

  get tenantId(): string {
    return this._tenantId;
  }
  get platform(): PlatformType {
    return this._platform;
  }
  get accessToken(): string {
    return this._accessToken;
  }
  get refreshToken(): string | undefined {
    return this._refreshToken;
  }
  get tokenExpiresAt(): Date | undefined {
    return this._tokenExpiresAt;
  }
  get externalId(): string {
    return this._externalId;
  }
  get platformConfigs(): Record<string, any> | undefined {
    return this._platformConfigs;
  }
  get status(): IntegrationStatus {
    return this._status;
  }

  updateTokens(
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date,
  ): void {
    this._accessToken = accessToken;
    if (refreshToken) this._refreshToken = refreshToken;
    if (expiresAt) this._tokenExpiresAt = expiresAt;
    this.updateTimestamp();
  }

  updateStatus(status: IntegrationStatus): void {
    this._status = status;
    this.updateTimestamp();
  }

  setExternalId(externalId: string): void {
    this._externalId = externalId;
    this.updateTimestamp();
  }

  isActive(): boolean {
    console.log(1);
    if (this._status !== IntegrationStatus.CONNECTED) {
      return false;
    }
    console.log(2);
    if (!this._accessToken) {
      return false;
    }
    console.log(3);

    if (!this._tokenExpiresAt) {
      return true;
    }
    console.log(4);

    return this._tokenExpiresAt > new Date();
  }
  setPlatformConfigs(configs: Record<string, any>): void {
    this._platformConfigs = { ...this._platformConfigs, ...configs };
    this.updateTimestamp();
  }

  disconnect(): void {
    this._status = IntegrationStatus.DISCONNECTED;
    this.updateTimestamp();
  }

  isTokenExpired(): boolean {
    if (!this._tokenExpiresAt) return false;
    return new Date() >= this._tokenExpiresAt;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      tenantId: this._tenantId,
      platform: this._platform,
      accessToken: this._accessToken,
      refreshToken: this._refreshToken,
      tokenExpiresAt: this._tokenExpiresAt,
      externalId: this._externalId,
      platformConfigs: this._platformConfigs,
      status: this._status,
    };
  }
}
