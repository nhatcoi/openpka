# OpenAcademix

Hệ thống quản lý đào tạo (Training Management System) được xây dựng với Next.js 15.

## Yêu cầu

- Node.js 20+
- pnpm 9+

## Cài đặt

```bash
# Cài pnpm (nếu chưa có)
corepack enable

# Cài dependencies
pnpm install
```

## Chạy dự án

```bash
# Development
pnpm run dev

# Build production
pnpm run build

# Start production
pnpm start
```

## Database

```bash
# Generate Prisma Client
pnpm run db:generate

# Push schema to database
pnpm run db:push

# Run migrations
pnpm run db:migrate

# Open Prisma Studio
pnpm run db:studio
```

## Các lệnh khác

```bash
# Lint
pnpm run lint

# Build (skip type checking)
pnpm run build:skip-types
```
