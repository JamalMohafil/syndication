export abstract class BaseRepository<T> {
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
  abstract create(entity: T): Promise<T>;
  abstract update(id: string, entity: Partial<T>): Promise<T | null>;
  abstract delete(id: string): Promise<boolean>;
}
