import { Types } from 'mongoose';

export abstract class BaseEntity {
  protected _id: string | Types.ObjectId;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(
    id?: string | Types.ObjectId,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this._id = id ?? new Types.ObjectId();
    this._createdAt = createdAt ?? new Date();
    this._updatedAt = updatedAt ?? new Date();
  }

  get id(): string {
    return typeof this._id === 'string' ? this._id : this._id.toString();
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
