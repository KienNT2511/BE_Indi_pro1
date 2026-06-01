# Backend — Quản lý đơn hàng

## Tổng quan

NestJS REST API cho hệ thống quản lý đơn hàng. Hiện tại đang ở **Sprint 1** — đã hoàn thành cấu hình hệ thống và toàn bộ luồng xác thực (auth).

**Stack:** NestJS 11 · TypeORM 0.3 · PostgreSQL 15 · Passport JWT · bcrypt · class-validator

---

## Khởi động môi trường

### 1. Khởi động database (Docker)

```powershell
docker start backend_postgres
# Kiểm tra healthy chưa
docker ps --filter "name=backend_postgres"
```

Container: `backend_postgres` · Port: `localhost:5434` → nội bộ `5432`
Nếu container bị xoá: `docker-compose up -d`

### 2. Chạy server

```powershell
# Trong terminal riêng (watch mode)
yarn start:dev

# Hoặc chạy nền, log ra file
$p = Start-Process -FilePath "cmd.exe" -ArgumentList "/c yarn start:dev > app.log 2>&1" -WorkingDirectory "D:\Quản_lý_đơn_hàng\backend" -PassThru
```

Server: `http://localhost:3001`
Log nền: `D:\Quản_lý_đơn_hàng\backend\app.log`

### 3. Kiểm tra nhanh

```powershell
Invoke-RestMethod http://localhost:3001/api/v1
# => "Hello World!"
```

---

## Cấu trúc thư mục

```
src/
├── main.ts                        # Bootstrap: prefix=/api, versioning=URI/v1, port=3001
├── app.module.ts                  # Root module — import TypeORM, Config, modules
├── app.controller.ts
├── app.service.ts
│
├── config/                        # Factory functions cho TypeORM và JWT
│   ├── database.config.ts         # databaseConfig(ConfigService) → TypeOrmModuleOptions
│   └── jwt.config.ts              # jwtConfig(ConfigService) → JwtModuleOptions
│
├── modules/                       # Feature modules
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/                   # LoginDto · ChangePasswordDto · RefreshTokenDto
│   │   ├── guards/                # JwtAuthGuard · LocalAuthGuard · JwtRefreshGuard
│   │   └── strategies/            # local · jwt · jwt-refresh
│   └── users/
│       ├── users.module.ts
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── dto/                   # CreateUserDto
│       └── entities/              # User entity (bảng users)
│
└── common/                        # Dùng chung toàn app
    ├── constants/                 # ErrorCode, ErrorMessage
    ├── decorators/                # @CurrentUser() param decorator
    │   └── products/
    │       ├── products.module.ts
    │       ├── products.controller.ts
    │       ├── products.service.ts
    │       ├── dto/               # CreateProductDto · UpdateProductDto · QueryProductDto
    │       └── entities/          # Product entity (bảng products)
    └── common/
        ├── constants/             # ErrorCode, ErrorMessage
    ├── enums/                     # Role: admin | user
    ├── exceptions/                # AppException extends HttpException
    ├── filters/                   # HttpExceptionFilter (global)
    ├── interceptors/              # (chưa có — placeholder)
    └── pipes/                     # (chưa có — placeholder)
```

---

## Biến môi trường (.env)

| Biến | Giá trị |
|---|---|
| `PORT` | `3001` |
| `NODE_ENV` | `development` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5434` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | `postgres` |
| `DB_NAME` | `backend_db` |
| `JWT_SECRET` | `your-super-secret-key-change-in-production` |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_SECRET` | `your-super-refresh-secret-key-change-in-production` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |

> `DATABASE_URL` trong `.env` dùng host `postgres` (Docker internal) — không dùng cho app, chỉ dành cho migration tool chạy trong Docker network.

---

## API Routes

Base URL: `http://localhost:3001/api/v1`

### Auth — `/api/v1/auth`

| Method | Path | Guard | Mô tả |
|---|---|---|---|
| `POST` | `/register` | — | Tạo tài khoản mới |
| `POST` | `/login` | LocalAuth (email+password) | Trả về `access_token` + `refresh_token` |
| `POST` | `/refresh` | JwtRefresh | Cấp lại cặp token mới |
| `POST` | `/logout` | JwtAuth | Xoá refresh token khỏi DB |
| `GET` | `/me` | JwtAuth | Thông tin user hiện tại |
| `PATCH` | `/change-password` | JwtAuth | Đổi mật khẩu (204 No Content) |

### Products — `/api/v1/products`

| Method | Path | Guard | Mô tả |
|---|---|---|---|
| `POST` | `/` | — | Tạo sản phẩm mới |
| `GET` | `/` | — | Danh sách sản phẩm (filter + pagination) |
| `GET` | `/:id` | — | Chi tiết sản phẩm (UUID) |
| `PATCH` | `/:id` | — | Cập nhật sản phẩm |
| `DELETE` | `/:id` | — | Xóa sản phẩm (204 No Content) |
| `POST` | `/upload` | — | Upload file Excel để import hàng loạt |

**Query params cho `GET /products`:** `?search=&category=&page=1&limit=20`

**Upload Excel:**
- Field name: `file`, content-type: `multipart/form-data`
- Định dạng chấp nhận: `.xlsx`, `.xls` — tối đa 5MB
- Header cột hỗ trợ (tiếng Anh hoặc tiếng Việt, không phân biệt hoa thường):

| Cột bắt buộc | Alias chấp nhận |
|---|---|
| name | `tên`, `tên sản phẩm` |
| price | `giá` |
| quantity | `số lượng` |
| category | `phân loại`, `danh mục` |
| material *(optional)* | `chất liệu` |

**Upload response:**
```json
{ "inserted": 10, "failed": 2, "errors": [{ "row": 3, "reason": "Thiếu tên sản phẩm" }] }
```

### Users — `/api/v1/users`

| Method | Path | Guard | Mô tả |
|---|---|---|---|
| `POST` | `/` | — | Tạo user (duplicate của /auth/register) |
| `GET` | `/:id` | — | Lấy user theo UUID |

---

## Luồng xác thực

```
Login  →  LocalStrategy.validate()  →  AuthService.validateUser()
       →  AuthService.login()       →  generateTokens() + saveRefreshToken()
       →  { access_token, refresh_token }

Request bảo vệ  →  Authorization: Bearer <access_token>
                →  JwtStrategy.validate()  →  req.user = { id, email }

Refresh  →  Authorization: Bearer <refresh_token>
         →  JwtRefreshStrategy.validate()  →  bcrypt.compare với hash DB
         →  generateTokens() mới + lưu hash mới
```

- `access_token`: JWT 15 phút, ký bằng `JWT_SECRET`
- `refresh_token`: JWT 7 ngày, ký bằng `JWT_REFRESH_SECRET`, lưu dưới dạng **bcrypt hash** trong cột `hashedRefreshToken`
- Logout / đổi mật khẩu → xoá `hashedRefreshToken` (vô hiệu hoá refresh token)

---

## Database — User entity

Bảng: `users`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `uuid` | PK, auto-generate |
| `email` | `varchar` | unique |
| `password` | `varchar` | bcrypt hash |
| `name` | `varchar` | nullable |
| `role` | `enum` | `admin` / `user`, default `user` |
| `hashedRefreshToken` | `text` | nullable, bcrypt hash |
| `createdAt` | `timestamp` | auto |
| `updatedAt` | `timestamp` | auto |

`synchronize: true` khi `NODE_ENV !== 'production'` — schema tự đồng bộ khi dev.

---

## Error response format

```json
{ "statusCode": 401, "errorCode": "AUTH_001", "message": "Invalid email or password" }
```

Validation error (422):
```json
{ "statusCode": 422, "errorCode": "VALIDATION_001", "message": "Validation failed", "details": ["..."] }
```

### Error codes

| Code | HTTP | Ý nghĩa |
|---|---|---|
| `AUTH_001` | 401 | Sai email/password |
| `AUTH_002` | 403 | Refresh token không khớp |
| `AUTH_003` | 401 | Unauthorized |
| `AUTH_004` | 400 | Sai mật khẩu hiện tại |
| `AUTH_005` | 400 | Mật khẩu mới trùng mật khẩu cũ |
| `USER_001` | 409 | Email đã tồn tại |
| `USER_002` | 404 | Không tìm thấy user |
| `PRODUCT_001` | 404 | Không tìm thấy sản phẩm |
| `PRODUCT_002` | 400 | File không hợp lệ (chỉ nhận .xlsx, .xls) |
| `PRODUCT_003` | 400 | File không có dữ liệu |
| `VALIDATION_001` | 422 | Validation failed |

---

## Trạng thái dự án

### Sprint 1 — Đã xong
- [x] Cấu hình NestJS (prefix, versioning, ValidationPipe, ExceptionFilter)
- [x] Kết nối PostgreSQL qua TypeORM
- [x] Config tách riêng: `src/config/database.config.ts`, `src/config/jwt.config.ts`
- [x] Module Users + Module Auth đầy đủ
- [x] JWT access + refresh token với bcrypt hash
- [x] Global error handling với error code chuẩn hoá
- [x] `@CurrentUser()` param decorator tại `src/common/decorators/`
- [x] Docker + docker-compose cho PostgreSQL
- [x] Cấu trúc chuẩn: `src/config/` · `src/modules/` · `src/common/`

### Chưa làm (dự kiến Sprint tiếp)
- [x] Module Products: CRUD + upload Excel (xlsx/xls, max 5MB)
- [ ] Module Orders — core feature của hệ thống
- [ ] Role-based access control (đã có `Role` enum, chưa có RolesGuard)
- [ ] `ResponseInterceptor` — chuẩn hoá response thành `{ data, statusCode, message }`
- [ ] Pagination, filtering cho danh sách
- [ ] Swagger / OpenAPI documentation
- [ ] Migrations thay vì `synchronize`
- [ ] `.env.example` file

---

## Lưu ý kỹ thuật

- `UsersController.create()` và `AuthController.register()` cùng gọi `usersService.create()` — trùng lặp, cân nhắc bỏ route `POST /users` khi có RBAC.
- `@CurrentUser()` decorator đã sẵn sàng dùng thay cho `@Request() req` → `req.user`.
- Password validation chỉ có `MinLength(6)` — chưa yêu cầu độ phức tạp.
- Chưa có rate limiting trên `/auth/login`.
