import { DomainException } from './domain.exception';

export class ValidationDomainException extends DomainException {
  constructor(message: string) {
    super(`Validation error: ${message}`);
    this.name = 'ValidationDomainException';
  }
}
