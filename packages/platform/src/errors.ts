import type { ContentfulStatusCode } from 'hono/utils/http-status';

export abstract class DomainError extends Error {
  abstract readonly statusCode: ContentfulStatusCode;
  readonly userMessage: string;

  constructor(userMessage: string, internalDetail?: string) {
    super(internalDetail ? `${userMessage}: ${internalDetail}` : userMessage);
    this.name = this.constructor.name;
    this.userMessage = userMessage;
  }
}

export class NotFoundError extends DomainError {
  readonly statusCode = 404;
}

export class ValidationError extends DomainError {
  readonly statusCode = 400;
}

export class ForbiddenError extends DomainError {
  readonly statusCode = 403;
}

export class ConflictError extends DomainError {
  readonly statusCode = 409;
}
