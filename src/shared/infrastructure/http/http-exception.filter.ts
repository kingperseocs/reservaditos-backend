import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError, DomainErrorType } from '../../domain/domain-error';
import { ErrorResponseDto } from './error-response.dto';

const STATUS_BY_TYPE: Record<DomainErrorType, HttpStatus> = {
  [DomainErrorType.INVALID]: HttpStatus.BAD_REQUEST,
  [DomainErrorType.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [DomainErrorType.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [DomainErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [DomainErrorType.CONFLICT]: HttpStatus.CONFLICT,
  [DomainErrorType.UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
};

/** Every error leaves the API as { statusCode, code, message, details? }. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const body = this.toBody(exception);
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(body.statusCode)
      .json(body);
  }

  private toBody(exception: unknown): ErrorResponseDto {
    if (exception instanceof DomainError) {
      return {
        statusCode: STATUS_BY_TYPE[exception.type],
        code: exception.code,
        message: exception.message,
        ...(exception.details && { details: exception.details }),
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      return {
        statusCode,
        code:
          statusCode === 400
            ? 'VALIDATION_ERROR'
            : (HttpStatus[statusCode] ?? 'HTTP_ERROR'),
        message: this.messageOf(exception),
      };
    }

    this.logger.error(exception);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado.',
    };
  }

  private messageOf(exception: HttpException): string {
    const response = exception.getResponse();
    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      const { message } = response as { message: string | string[] };
      return Array.isArray(message) ? message.join('; ') : message;
    }
    return exception.message;
  }
}
