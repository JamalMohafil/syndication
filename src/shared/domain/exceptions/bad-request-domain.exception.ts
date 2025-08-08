import { DomainException } from './domain.exception';

export class BadRequestDomainException extends DomainException {
  constructor(message?: string) {
    super(message ?? 'Bad request');
    this.name = 'BadRequestDomainException';
  }
}
