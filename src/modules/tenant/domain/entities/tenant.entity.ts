import { BaseEntity } from '../../../../shared/domain/entities/base.entity';

export interface TenantProps {
  name: string;
  email: string;
  defaultLanguage: string;
  defaultCurrency: string;
  timezone: string;
  isActive: boolean;
}

export class TenantEntity extends BaseEntity {
  private _name: string;
  private _email: string;
  private _defaultLanguage: string;
  private _defaultCurrency: string;
  private _timezone: string;
  private _isActive: boolean;

  constructor(
    params: TenantProps,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._name = params.name;
    this._email = params.email;
    this._defaultLanguage = params.defaultLanguage;
    this._defaultCurrency = params.defaultCurrency;
    this._timezone = params.timezone;
    this._isActive = params.isActive;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get defaultLanguage(): string {
    return this._defaultLanguage;
  }

  get defaultCurrency(): string {
    return this._defaultCurrency;
  }

  get timezone(): string {
    return this._timezone;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  updateProfile(name: string, email: string): void {
    this._name = name;
    this._email = email;
    this.updateTimestamp();
  }

  updateSettings(language: string, currency: string, timezone: string): void {
    this._defaultLanguage = language;
    this._defaultCurrency = currency;
    this._timezone = timezone;
    this.updateTimestamp();
  }

  activate(): void {
    this._isActive = true;
    this.updateTimestamp();
  }

  deactivate(): void {
    this._isActive = false;
    this.updateTimestamp();
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this._name,
      email: this._email,
      defaultLanguage: this._defaultLanguage,
      defaultCurrency: this._defaultCurrency,
      timezone: this._timezone,
      isActive: this._isActive,
    };
  }
}
