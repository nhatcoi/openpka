# Architecture

Tài liệu kiến trúc của hệ thống OpenAcademix.

## Nội dung

- [Tổng quan kiến trúc](./overview.md) - Kiến trúc tổng quan hệ thống
- [Thuật ngữ & Ký hiệu](./terminology.md) - RACI và các thuật ngữ chính
- [Design Diagrams](./design/) - Các biểu đồ thiết kế chi tiết

## Kiến trúc tổng quan

Hệ thống OpenAcademix được xây dựng trên nền tảng:
- **Frontend**: Next.js 15 (React)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL với Prisma ORM
- **Authentication**: NextAuth.js

## Cấu trúc

- Monolithic architecture với module-based design
- Schema-based database organization
- Role-based access control (RBAC)

