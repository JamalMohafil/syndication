import { BaseEntity } from '../../../../shared/domain/entities/base.entity';
import { PlatformType } from '../enums/platform-type.enum';
import { IntegrationStatus } from '../enums/integration-status.enum';

export interface CatalogIntegrationConstructorParams {
  id?: string;
  tenantId: string;
  platform: PlatformType;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  externalId?: string;
  googleAdsCustomerId?: string;
  googleAdsAccessToken?: string;
  googleAdsRefreshToken?: string;
  status: IntegrationStatus;
}

export class CatalogIntegrationEntity extends BaseEntity {
  private _tenantId: string;
  private _platform: PlatformType;
  private _accessToken: string;
  private _refreshToken?: string;
  private _tokenExpiresAt?: Date;
  private _externalId?: string;
  private _googleAdsCustomerId?: string;
  private _googleAdsAccessToken?: string;
  private _googleAdsRefreshToken?: string;
  private _status: IntegrationStatus;

  constructor(params: CatalogIntegrationConstructorParams) {
    super();
    this._tenantId = params.tenantId;
    this._platform = params.platform;
    this._accessToken = params.accessToken;
    this._refreshToken = params.refreshToken;
    this._tokenExpiresAt = params.tokenExpiresAt;
    this._externalId = params.externalId;
    this._googleAdsCustomerId = params.googleAdsCustomerId;
    this._googleAdsAccessToken = params.googleAdsAccessToken;
    this._googleAdsRefreshToken = params.googleAdsRefreshToken;
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
  get externalId(): string | undefined {
    return this._externalId;
  }
  get googleAdsCustomerId(): string | undefined {
    return this._googleAdsCustomerId;
  }
  get googleAdsAccessToken(): string | undefined {
    return this._googleAdsAccessToken;
  }
  get googleAdsRefreshToken(): string | undefined {
    return this._googleAdsRefreshToken;
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
      googleAdsCustomerId: this._googleAdsCustomerId,
      googleAdsAccessToken: this._googleAdsAccessToken,
      googleAdsRefreshToken: this._googleAdsRefreshToken,
      status: this._status,
    };
  }
}
