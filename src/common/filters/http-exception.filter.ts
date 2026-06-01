import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '../constants/error-code.constant';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse() as any;

    // Validation errors từ class-validator (mảng message)
    if (Array.isArray(body?.message)) {
      return response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: body.message,
      });
    }

    // AppException (có errorCode riêng)
    if (body?.errorCode) {
      return response.status(status).json({
        statusCode: status,
        errorCode: body.errorCode,
        message: body.message,
      });
    }

    // Fallback cho các HttpException khác (guard, passport...)
    return response.status(status).json({
      statusCode: status,
      errorCode: this.resolveErrorCode(status),
      message: typeof body?.message === 'string' ? body.message : exception.message,
    });
  }

  private resolveErrorCode(status: number): string {
    if (status === HttpStatus.UNAUTHORIZED) return ErrorCode.AUTH_UNAUTHORIZED;
    if (status === HttpStatus.FORBIDDEN) return ErrorCode.AUTH_ACCESS_DENIED;
    return 'INTERNAL_ERROR';
  }
}
