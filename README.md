# AI Code Explainer - Backend API

Express + TypeScript + MongoDB backend for authentication and media management.

## Tech Stack

- Express.js
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- Zod Validation
- Nodemailer
- Multer
- Cloudflare R2
- NextAuth.js Integration

## Installation

```bash
pnpm install
```

Create a `.env` file and add your environment variables.

Start the development server:

```bash
pnpm dev
```

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
```

## Features

- User Registration
- Email OTP Verification
- Login with JWT
- Google & GitHub Login
- Forgot & Reset Password
- Refresh Token
- Role-Based Authorization
- Image Upload
- Cloudflare R2 Storage
- Global Error Handling

## API Endpoints

### User

- POST `/api/v1/user/create`
- POST `/api/v1/user/verify-otp`

### Authentication

- POST `/api/auth/login`
- POST `/api/auth/social-sync`
- POST `/api/auth/forgot-password`
- POST `/api/auth/reset-password`
- POST `/api/auth/refresh-token`
- POST `/api/auth/logout`

### Media

- POST `/api/v1/media`
- GET `/api/v1/media/all`
- GET `/api/v1/media/:id`
- PATCH `/api/v1/media/:id`
- DELETE `/api/v1/media/:id`

## Environment Variables

```env
DATABASE_URL=
PORT=3001
FRONTEND_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
```

## Response Format

```json
{
  "status": 200,
  "message": "Success",
  "data": {}
}
```

## License

ISC