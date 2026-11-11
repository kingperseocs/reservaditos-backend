import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from './error-response.dto';

const DESCRIPTIONS: Record<number, string> = {
  400: 'Invalid input',
  401: 'Missing or unknown x-user-id',
  403: 'Not allowed',
  404: 'Not found',
  409: 'Business rule conflict',
};

/** Documents error responses with the shared error shape. */
export function ApiErrorResponses(...statuses: number[]): MethodDecorator {
  return applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: DESCRIPTIONS[status],
        type: ErrorResponseDto,
      }),
    ),
  );
}
