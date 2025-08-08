import { Types } from 'mongoose';

export abstract class BaseEntity {
  protected _id: string;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor() {
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): string {
    return this._id.toString();
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
