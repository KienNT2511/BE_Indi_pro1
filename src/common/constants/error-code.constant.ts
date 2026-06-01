export const ErrorCode = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_ACCESS_DENIED: 'AUTH_002',
  AUTH_UNAUTHORIZED: 'AUTH_003',
  AUTH_WRONG_CURRENT_PASSWORD: 'AUTH_004',
  AUTH_SAME_PASSWORD: 'AUTH_005',

  // User
  USER_EMAIL_EXISTS: 'USER_001',
  USER_NOT_FOUND: 'USER_002',

  // Product
  PRODUCT_NOT_FOUND: 'PRODUCT_001',
  PRODUCT_UPLOAD_INVALID_FILE: 'PRODUCT_002',
  PRODUCT_UPLOAD_EMPTY: 'PRODUCT_003',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_001',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorMessage: Record<ErrorCodeType, string> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.AUTH_ACCESS_DENIED]: 'Access denied',
  [ErrorCode.AUTH_UNAUTHORIZED]: 'Unauthorized',
  [ErrorCode.AUTH_WRONG_CURRENT_PASSWORD]: 'Current password is incorrect',
  [ErrorCode.AUTH_SAME_PASSWORD]: 'New password must be different from current password',
  [ErrorCode.USER_EMAIL_EXISTS]: 'Email already in use',
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.PRODUCT_NOT_FOUND]: 'Product not found',
  [ErrorCode.PRODUCT_UPLOAD_INVALID_FILE]: 'Invalid file. Only .xlsx and .xls are accepted',
  [ErrorCode.PRODUCT_UPLOAD_EMPTY]: 'File contains no data rows',
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
};
