# AI Code Explainer — Backend API


Express + TypeScript + MongoDB backend for user authentication and media management. Designed to work with a **Next.js** frontend using **NextAuth.js** + custom JWT.


**Base URL (dev):** `http://localhost:3001`


---


## Tech Stack & Packages


| Package | Purpose |
|---------|---------|
| `express` | REST API framework |
| `mongoose` | MongoDB ODM |
| `typescript` + `ts-node` | TypeScript dev & build |
| `zod` | Request validation |
| `jsonwebtoken` | Access & refresh JWT |
| `bcrypt` | Password hashing |
| `nodemailer` | Gmail SMTP (OTP emails) |
| `cookie-parser` | HttpOnly refresh token cookie |
| `cors` | Cross-origin (Next.js frontend) |
| `multer` | Image upload (memory buffer) |
| `@aws-sdk/client-s3` | Cloudflare R2 storage |
| `dotenv` | Environment variables |
| `http-status` | HTTP status codes |


**Package manager:** `pnpm`


---


## Project Structure


```
server-setup/
├── app.ts                 # Express app, CORS, routes, error handler
├── server.ts              # DB connect, bootstrap, listen
└── src/
   ├── config/            # App config
   ├── errors/            # AppError class
   ├── lib/               # jwt, mailer, email templates, file-upload
   ├── middlewares/       # auth, validateRequest, globalErrorHandler
   ├── modules/
   │   ├── auth/          # login, social-sync, forgot/reset password
   │   ├── user/          # register, verify OTP
   │  
   ├── type/              # Shared enums (UserRole)
   └── utils/             # catchAsync, sendResponse, sanitizeUser
```


---


## Setup


```bash
pnpm install
cp .env.example .env   # fill in your values
pnpm dev               # http://localhost:3001
```


**Scripts**


| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (ts-node) |
| `pnpm build` | Compile TypeScript → `dist/` |
| `pnpm start` | Run production build |


---


## Environment Variables


```env
DATABASE_URL=mongodb://localhost:27017/myapp
PORT=3001
FRONTEND_URL=http://localhost:3000


JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d


SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=your_secure_password


# Gmail SMTP (register OTP + forgot password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASS=your_gmail_app_password
MAIL_FROM=yourname@gmail.com
MAIL_FROM_NAME=AI Code Explainer
```


On startup, `bootstrapSuperAdmin()` creates a `SUPER_ADMIN` user if none exists.


---


## Architecture


### Auth flow


```
Register  → OTP email → Verify OTP → Login → accessToken + refreshToken cookie
Google/GitHub (NextAuth) → POST /api/auth/social-sync → JWT tokens
Forgot password → OTP email → Reset password → Login
```


### Roles


| Role | How assigned |
|------|--------------|
| `STUDENT` | Auto on register / social login |
| `ADMIN` | Manual (DB / future admin panel) |
| `SUPER_ADMIN` | Bootstrapped from `.env` |


### Response format (all endpoints)


```json
{
 "status": 200,
 "message": "Human readable message",
 "data": { }
}
```


Sensitive fields (`password`, `otp`) are never returned — see `sanitizeUser`.


---


## Error Handling


| Layer | File | What it does |
|-------|------|--------------|
| Validation | `validateRequest.ts` + Zod schemas | Returns `400` with field errors |
| Operational errors | `AppError` class | Known errors with status code |
| Global handler | `globalErrorHandler.ts` | Catches all errors |
| Async wrapper | `catchAsync.ts` | Forwards async errors to handler |
| 404 | `app.ts` | Unknown routes → `404` |


**Global handler covers:**


- `AppError` → custom status + message
- MongoDB duplicate key (`11000`) → `409`
- Mongoose `CastError` → `400`
- Mongoose `ValidationError` → `400` with field map
- `MulterError` (file size) → `400`
- Mongo network errors → `503`
- Unknown errors → `500`


**Example error:**


```json
{
 "status": 400,
 "message": "Invalid OTP",
 "data": null
}
```


---


## API Reference


### User — `/api/v1/user`


#### Register


```bash
curl -X POST http://localhost:3001/api/v1/user/create \
 -H "Content-Type: application/json" \
 -d '{"name":"Ripa","email":"student@gmail.com","password":"123456","phone":"01712345678","age":22}'
```


```json
{ "status": 201, "message": "User created successfully", "data": { "email": "...", "role": "STUDENT", "isVerified": false } }
```


OTP sent to email (not in response). Role always `STUDENT` (not accepted from frontend).


---


#### Verify OTP


```bash
curl -X POST http://localhost:3001/api/v1/user/verify-otp \
 -H "Content-Type: application/json" \
 -d '{"email":"student@gmail.com","otp":"482910"}'
```


```json
{ "status": 200, "message": "User verified successfully", "data": { "email": "...", "isVerified": true } }
```


OTP expires in **10 minutes**.


---


### Auth — `/api/auth`


#### Login


```bash
curl -X POST http://localhost:3001/api/auth/login \
 -H "Content-Type: application/json" \
 -c cookies.txt \
 -d '{"email":"student@gmail.com","password":"123456"}'
```


```json
{
 "status": 200,
 "message": "Login successful",
 "data": {
   "user": { "_id": "...", "email": "...", "role": "STUDENT" },
   "accessToken": "eyJhbG...",
   "refreshToken": "eyJhbG..."
 }
}
```


`refreshToken` also set as **httpOnly cookie**.


---


#### Social Sync (NextAuth → Express)


```bash
curl -X POST http://localhost:3001/api/auth/social-sync \
 -H "Content-Type: application/json" \
 -c cookies.txt \
 -d '{
   "email": "user@gmail.com",
   "name": "Ripa",
   "avatar": "https://lh3.googleusercontent.com/photo.jpg",
   "provider": "google",
   "googleId": "1234567890"
 }'
```


```json
{ "status": 200, "message": "Social account synced successfully", "data": { "user": { ... }, "accessToken": "...", "refreshToken": "..." } }
```


For GitHub: `"provider": "github"` + `"githubId": "12345"`.


---


#### Forgot Password


```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
 -H "Content-Type: application/json" \
 -d '{"email":"student@gmail.com"}'
```


```json
{ "status": 200, "message": "If an account exists for this email, a reset OTP has been sent.", "data": null }
```


---


#### Reset Password


```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
 -H "Content-Type: application/json" \
 -d '{"email":"student@gmail.com","otp":"482910","newPassword":"newpass123"}'
```


```json
{ "status": 200, "message": "Password reset successfully", "data": { "email": "...", "isVerified": true } }
```


---


#### Refresh Token


```bash
curl -X POST http://localhost:3001/api/auth/refresh-token -b cookies.txt
```


```json
{ "status": 200, "message": "Token refreshed successfully", "data": { "accessToken": "eyJhbG..." } }
```


Uses `refreshToken` **cookie** (no body).


---


#### Logout


```bash
curl -X POST http://localhost:3001/api/auth/logout -b cookies.txt -c cookies.txt
```


```json
{ "status": 200, "message": "Logged out successfully", "data": null }
```


Clears `refreshToken` cookie. Frontend must also clear `accessToken`.


---


### Media — `/api/v1/media` (Admin only)


**Header:** `Authorization: Bearer <accessToken>` 
**Roles:** `ADMIN` or `SUPER_ADMIN`


#### Upload image


```bash
curl -X POST http://localhost:3001/api/v1/media/ \
 -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 -F "file=@/path/to/image.jpg" \
 -F "alt=Profile photo"
```


```json
{ "status": 201, "message": "Image uploaded successfully", "data": { "_id": "...", "url": "...", "name": "image.jpg" } }
```


Max **10MB**. Allowed: JPEG, PNG, WebP. Stored on **Cloudflare R2**.


---


#### List images


```bash
curl "http://localhost:3001/api/v1/media/all?page=1&limit=20" \
 -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```


```json
{ "status": 200, "message": "Images retrieved successfully", "data": { "images": [...], "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 } } }
```


---


#### Get / Update / Delete image


```bash
# Get by ID
curl http://localhost:3001/api/v1/media/IMAGE_ID \
 -H "Authorization: Bearer YOUR_ACCESS_TOKEN"


# Update (replace file)
curl -X PATCH http://localhost:3001/api/v1/media/IMAGE_ID \
 -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 -F "file=@/path/to/new.jpg"


# Delete
curl -X DELETE http://localhost:3001/api/v1/media/IMAGE_ID \
 -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```


---


## Frontend Integration (NextAuth)


1. **Credentials login** → call `POST /api/auth/login` in `authorize()`
2. **Google/GitHub** → call `POST /api/auth/social-sync` in JWT callback
3. Store `data.accessToken` in NextAuth session
4. API calls → `Authorization: Bearer <accessToken>`
5. Token refresh → `POST /api/auth/refresh-token` with `credentials: 'include'`


---


## CORS


Allowed origins:


- `FRONTEND_URL` from `.env`
- `http://localhost:*` and `http://127.0.0.1:*`


`credentials: true` enabled for refresh token cookies.


---


## License


ISC





