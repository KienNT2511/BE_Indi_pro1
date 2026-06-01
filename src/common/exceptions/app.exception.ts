import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodeType, ErrorMessage } from '../constants/error-code.constant';

export class AppException extends HttpException {
  readonly errorCode: ErrorCodeType;

  constructor(errorCode: ErrorCodeType, httpStatus: HttpStatus) {
    super({ errorCode, message: ErrorMessage[errorCode] }, httpStatus);
    this.errorCode = errorCode;
  }
}
