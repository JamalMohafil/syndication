import { BaseEntity } from 'src/shared/domain/entities/base.entity';
import { FileType } from '../enums/file-type.enum';
import { FeedStatus } from '../enums/feed-status.enum';

export interface ProductFeedConstructorParams {
  id?: string;
  tenantId: string;
  fileUrl: string;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  totalProducts: number;
  status: FeedStatus;
  createdBy: string;
  errorMessage?: string;
}

export class ProductFeedEntity extends BaseEntity {
  private _tenantId: string;
  private _fileUrl: string;
  private _fileName: string;
  private _fileType: FileType;
  private _fileSize: number;
  private _totalProducts: number;
  private _status: FeedStatus;
  private _createdBy: string;
  private _errorMessage?: string;

  constructor(params: ProductFeedConstructorParams) {
    super();
    this._tenantId = params.tenantId;
    this._fileUrl = params.fileUrl;
    this._fileName = params.fileName;
    this._fileType = params.fileType;
    this._fileSize = params.fileSize;
    this._totalProducts = params.totalProducts;
    this._status = params.status;
    this._createdBy = params.createdBy;
    this._errorMessage = params.errorMessage;
  }

  get tenantId(): string {
    return this._tenantId;
  }
  get fileUrl(): string {
    return this._fileUrl;
  }
  get fileName(): string {
    return this._fileName;
  }
  get fileType(): FileType {
    return this._fileType;
  }
  get fileSize(): number {
    return this._fileSize;
  }
  get totalProducts(): number {
    return this._totalProducts;
  }
  get status(): FeedStatus {
    return this._status;
  }
  get createdBy(): string {
    return this._createdBy;
  }
  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  updateStatus(status: FeedStatus): void {
    this._status = status;
    this.updateTimestamp();
  }

  setError(errorMessage: string): void {
    this._status = FeedStatus.FAILED;
    this._errorMessage = errorMessage;
    this.updateTimestamp();
  }

  markAsCompleted(): void {
    this._status = FeedStatus.COMPLETED;
    this._errorMessage = undefined;
    this.updateTimestamp();
  }

  toJSON() {
    return {
      ...super.toJSON(),
      tenantId: this._tenantId,
      fileUrl: this._fileUrl,
      fileName: this._fileName,
      fileType: this._fileType,
      fileSize: this._fileSize,
      totalProducts: this._totalProducts,
      status: this._status,
      createdBy: this._createdBy,
      errorMessage: this._errorMessage,
    };
  }
}
