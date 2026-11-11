export enum DomainErrorType {
  INVALID = 'INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  /** An external dependency (e.g. the AI provider) failed or is not configured. */
  UNAVAILABLE = 'UNAVAILABLE',
}

/** Business rule violation. `code` is stable and meant for clients. */
export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly type: DomainErrorType = DomainErrorType.INVALID,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
