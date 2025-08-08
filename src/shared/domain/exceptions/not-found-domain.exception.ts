import { DomainException } from './domain.exception';

export class NotFoundDomainException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
    this.name = 'NotFoundDomainException';
  }
}
