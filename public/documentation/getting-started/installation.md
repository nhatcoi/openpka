# TÀI LIỆU HƯỚNG DẪN CÀI ĐẶT HỆ THỐNG OPENACADEMIX

## MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
3. [Yêu cầu hệ thống](#3-yêu-cầu-hệ-thống)
4. [Cài đặt môi trường](#4-cài-đặt-môi-trường)
5. [Cấu hình dự án](#5-cấu-hình-dự-án)
6. [Cài đặt cơ sở dữ liệu](#6-cài-đặt-cơ-sở-dữ-liệu)
7. [Chạy ứng dụng](#7-chạy-ứng-dụng)
8. [Cấu trúc mã nguồn](#8-cấu-trúc-mã-nguồn)
9. [Xử lý sự cố](#9-xử-lý-sự-cố)

---

## 1. TỔNG QUAN DỰ ÁN

OpenAcademix là một hệ thống quản lý đào tạo và quản trị tổ chức toàn diện, được xây dựng trên nền tảng Next.js 15. Hệ thống bao gồm các module chính:

- **Quản lý Nhân sự (HR)**: Quản lý nhân viên, vai trò, quyền hạn, đánh giá hiệu suất
- **Quản lý Tổ chức (Org)**: Quản lý cấu trúc tổ chức, đơn vị, phân công
- **Quản lý Đào tạo (TMS)**: Quản lý khóa học, chương trình đào tạo, chuyên ngành
- **Quản lý Học tập (Academic)**: Quản lý lịch học, đăng ký, điểm số
- **Quản lý Tài chính (Finance)**: Quản lý học phí, hóa đơn
- **Thông báo (Notification)**: Hệ thống thông báo đa kênh
- **Báo cáo (Reports)**: Báo cáo và thống kê

---

## 2. CÔNG NGHỆ SỬ DỤNG

### 2.1. Frontend Framework
- **Next.js 15.5.3**: Framework React với Server-Side Rendering (SSR) và Static Site Generation (SSG)
- **React 18.3.1**: Thư viện UI
- **TypeScript 5**: Ngôn ngữ lập trình với type safety

### 2.2. Styling
- **Tailwind CSS 4**: Utility-first CSS framework
- **Material-UI (MUI) 7.3.2**: Component library
- **Emotion**: CSS-in-JS library cho MUI
- **next-themes**: Quản lý theme (dark/light mode)

### 2.3. Backend & Database
- **PostgreSQL**: Cơ sở dữ liệu quan hệ
- **Prisma 6.16.2**: ORM (Object-Relational Mapping)
- **NextAuth 4.24.11**: Xác thực và phân quyền
- **bcryptjs**: Mã hóa mật khẩu

### 2.4. State Management & Data Fetching
- **TanStack Query (React Query) 5.87.4**: Quản lý server state và caching
- **React Context**: Quản lý state toàn cục

### 2.5. Validation & Type Safety
- **Zod 4.1.8**: Schema validation

### 2.6. Utilities
- **date-fns 4.1.0**: Xử lý ngày tháng
- **recharts 3.2.1**: Biểu đồ và visualization
- **react-d3-tree 3.6.6**: Hiển thị cây tổ chức
- **html2canvas & jspdf**: Xuất PDF
- **lucide-react**: Icon library

### 2.7. Development Tools
- **ESLint**: Linting
- **Turbopack**: Bundler nhanh (Next.js 15)
- **Docker**: Containerization

### 2.8. Deployment
- **Vercel**: Platform deployment (tùy chọn)
- **Docker Compose**: Orchestration

---

## 3. YÊU CẦU HỆ THỐNG

### 3.1. Phần mềm cần thiết
- **Node.js**: Phiên bản 20.x trở lên
- **npm**: Phiên bản 9.x trở lên (đi kèm Node.js)
- **PostgreSQL**: Phiên bản 15.x trở lên
- **Git**: Để clone repository
- **Docker** (tùy chọn): Phiên bản 20.x trở lên
- **Docker Compose** (tùy chọn): Phiên bản 2.x trở lên

### 3.2. Yêu cầu hệ thống
- **RAM**: Tối thiểu 4GB (khuyến nghị 8GB)
- **Ổ cứng**: Tối thiểu 10GB dung lượng trống
- **Hệ điều hành**: 
  - macOS 10.15+
  - Windows 10/11
  - Linux (Ubuntu 20.04+, Debian 11+)

---

## 4. CÀI ĐẶT MÔI TRƯỜNG

### 4.1. Cài đặt Node.js

#### Trên macOS (sử dụng Homebrew):
```bash
brew install node@20
```

#### Trên Ubuntu/Debian:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Trên Windows:
Tải và cài đặt từ [nodejs.org](https://nodejs.org/)

#### Kiểm tra cài đặt:
```bash
node --version  # Phải >= 20.0.0
npm --version   # Phải >= 9.0.0
```

### 4.2. Cài đặt PostgreSQL

#### Trên macOS (sử dụng Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Trên Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql-15 postgresql-contrib-15
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Trên Windows:
Tải và cài đặt từ [postgresql.org](https://www.postgresql.org/download/windows/)

#### Tạo database:
```bash
# Đăng nhập vào PostgreSQL
sudo -u postgres psql

# Tạo database
CREATE DATABASE openacademix;

# Tạo user (tùy chọn)
CREATE USER openacademix_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE openacademix TO openacademix_user;

# Thoát
\q
```

### 4.3. Cài đặt Docker (Tùy chọn)

#### Trên macOS:
Tải và cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/)

#### Trên Ubuntu/Debian:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### Kiểm tra cài đặt:
```bash
docker --version
docker-compose --version
```

---

## 5. CẤU HÌNH DỰ ÁN

### 5.1. Clone repository
```bash
git clone <repository-url>
cd openacademix
```

### 5.2. Cài đặt dependencies
```bash
npm install
```

### 5.3. Tạo file môi trường

Tạo file `.env.local` trong thư mục gốc của dự án:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/openacademix?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-a-random-string"

# Node Environment
NODE_ENV="development"
```

#### Giải thích các biến môi trường:

- **DATABASE_URL**: Connection string đến PostgreSQL database
  - Format: `postgresql://username:password@host:port/database?schema=schema_name`
  - Ví dụ: `postgresql://postgres:password@localhost:5432/openacademix?schema=public`

- **NEXTAUTH_URL**: URL của ứng dụng (development: `http://localhost:3000`)
- **NEXTAUTH_SECRET**: Secret key để mã hóa JWT tokens (tạo random string)
  - Có thể tạo bằng: `openssl rand -base64 32`

#### Tạo NEXTAUTH_SECRET:
```bash
# Trên Linux/macOS
openssl rand -base64 32

# Hoặc sử dụng Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5.4. Cấu hình database schemas

Hệ thống sử dụng nhiều schemas trong PostgreSQL:
- `academic`: Dữ liệu học thuật
- `auth`: Xác thực và phân quyền
- `finance`: Tài chính
- `hr`: Nhân sự
- `notification`: Thông báo
- `org`: Tổ chức
- `public`: Dữ liệu công khai
- `report`: Báo cáo
- `schedule`: Lịch học
- `student`: Sinh viên

Đảm bảo database có quyền tạo các schemas này.

---

## 6. CÀI ĐẶT CƠ SỞ DỮ LIỆU

### 6.1. Generate Prisma Client
```bash
npm run db:generate
```

Lệnh này sẽ tạo Prisma Client dựa trên schema trong `prisma/schema.prisma`.

### 6.2. Chạy migrations

#### Phương pháp 1: Push schema (Development)
```bash
npm run db:push
```

Lệnh này sẽ đồng bộ schema với database mà không tạo migration files.

#### Phương pháp 2: Migrate (Production)
```bash
npm run db:migrate
```

Lệnh này sẽ tạo migration files và áp dụng chúng vào database.

### 6.3. Kiểm tra database

Mở Prisma Studio để xem và quản lý dữ liệu:
```bash
npm run db:studio
```

Truy cập: `http://localhost:5555`

### 6.4. Tạo dữ liệu mẫu (Tùy chọn)

Sau khi cài đặt database, bạn có thể cần tạo:
- User admin đầu tiên
- Roles và permissions cơ bản
- Dữ liệu mẫu cho testing

---

## 7. CHẠY ỨNG DỤNG

### 7.1. Development Mode

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

### 7.2. Build Production

```bash
npm run build
```

### 7.3. Chạy Production

```bash
npm start
```

### 7.4. Sử dụng Docker

#### Build image:
```bash
docker build -t openacademix .
```

#### Chạy với Docker Compose:
```bash
docker-compose up -d
```

#### Xem logs:
```bash
docker-compose logs -f
```

#### Dừng containers:
```bash
docker-compose down
```

### 7.5. Truy cập ứng dụng

- **Development**: `http://localhost:3000`
- **Production (Docker)**: `http://localhost:3001` (theo cấu hình docker-compose.yml)

---

## 8. CẤU TRÚC MÃ NGUỒN

### 8.1. Cấu trúc thư mục tổng quan

```
openacademix/
├── prisma/                 # Prisma schema và migrations
│   └── schema.prisma       # Database schema definition
├── public/                 # Static files
│   └── uploads/            # Uploaded files
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # Auth routes
│   │   ├── (hr)/           # HR module routes
│   │   ├── (org)/          # Organization module routes
│   │   ├── (tms)/          # TMS module routes
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # Authentication API
│   │   │   ├── hr/         # HR API
│   │   │   ├── org/        # Organization API
│   │   │   ├── tms/        # TMS API
│   │   │   └── academic/   # Academic API
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── academic/       # Academic components
│   │   ├── auth/           # Auth components
│   │   ├── nav/            # Navigation components
│   │   └── ...
│   ├── lib/                # Utility libraries
│   │   ├── db.ts           # Prisma client
│   │   ├── auth/           # Auth utilities
│   │   ├── api/            # API utilities
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript types
│   ├── utils/              # Utility functions
│   └── constants/          # Constants
├── middleware.ts           # Next.js middleware (auth & permissions)
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies
└── docker-compose.yml      # Docker Compose configuration
```

### 8.2. Chi tiết các thư mục chính

#### 8.2.1. `src/app/` - Next.js App Router

Cấu trúc routes theo module:

- **`(auth)/auth/signin/`**: Trang đăng nhập
- **`(hr)/hr/`**: Module quản lý nhân sự
  - Dashboard, employees, roles, permissions, etc.
- **`(org)/org/`**: Module quản lý tổ chức
  - Dashboard, tree, units, assignments, config
- **`(tms)/tms/`**: Module quản lý đào tạo
  - Courses, programs, majors, curriculum, cohorts
- **`api/`**: API endpoints
  - RESTful APIs cho các module

#### 8.2.2. `src/components/` - React Components

- **`academic/`**: Components cho academic module
- **`auth/`**: Components cho authentication
  - `PermissionGuard.tsx`: Bảo vệ routes với permissions
  - `PermissionButton.tsx`: Button với permission check
- **`nav/`**: Navigation components
  - Sidebars cho các module
- **`form/`**: Form components
- **`misc/`**: Miscellaneous components

#### 8.2.3. `src/lib/` - Libraries & Utilities

- **`db.ts`**: Prisma Client instance
- **`auth/`**: Authentication utilities
  - `auth.ts`: NextAuth configuration
  - `hierarchical-permissions.ts`: Hierarchical permission system
  - `permission-utils.ts`: Permission utilities
- **`api/`**: API utilities
  - `api-handler.ts`: API request handler
  - `api-schemas.ts`: API schemas
  - `fetcher.ts`: API fetcher
- **`academic/`**: Academic utilities
  - `workflow-engine.ts`: Workflow engine
- **`ui/`**: UI utilities
  - `mui-theme.ts`: Material-UI theme
  - `providers.tsx`: React providers

#### 8.2.4. `src/hooks/` - Custom Hooks

- `use-academic-history.ts`: Hook cho academic history
- `use-academic-workflows.ts`: Hook cho workflows
- `use-documents.ts`: Hook cho documents
- `use-employee-search.ts`: Hook cho employee search
- `use-hierarchical-permissions.ts`: Hook cho permissions
- `use-org-units-pagination.ts`: Hook cho pagination
- `use-pagination.ts`: Generic pagination hook

#### 8.2.5. `src/types/` - TypeScript Types

- `curriculum.ts`: Curriculum types
- `documents.ts`: Document types
- `next-auth.d.ts`: NextAuth type extensions
- `statistics.ts`: Statistics types

#### 8.2.6. `src/utils/` - Utility Functions

- `format-utils.ts`: Formatting utilities
- `org-unit-utils.ts`: Organization unit utilities
- `tree-utils.ts`: Tree utilities
- `validation-utils.ts`: Validation utilities
- `serialize.ts`: Serialization utilities

#### 8.2.7. `prisma/` - Database Schema

- **`schema.prisma`**: Prisma schema definition
  - Định nghĩa tất cả models, relations, và indexes
  - Sử dụng multiple schemas (academic, auth, hr, org, etc.)

### 8.3. Cấu trúc API

API được tổ chức theo module:

```
api/
├── auth/              # Authentication
├── hr/                # Human Resources
├── org/               # Organization
├── tms/               # Training Management System
├── academic/          # Academic
├── cohorts/           # Cohorts
├── documents/         # Documents
└── upload/            # File upload
```

Mỗi API route tuân theo RESTful conventions:
- `GET /api/{module}/{resource}`: Lấy danh sách
- `GET /api/{module}/{resource}/[id]`: Lấy chi tiết
- `POST /api/{module}/{resource}`: Tạo mới
- `PUT /api/{module}/{resource}/[id]`: Cập nhật
- `DELETE /api/{module}/{resource}/[id]`: Xóa

### 8.4. Authentication & Authorization

#### 8.4.1. NextAuth Configuration
- File: `src/lib/auth/auth.ts`
- Provider: Credentials
- Session: JWT
- Callbacks: JWT và session callbacks để thêm permissions

#### 8.4.2. Middleware
- File: `middleware.ts`
- Kiểm tra authentication và permissions
- Bảo vệ routes và API endpoints

#### 8.4.3. Permission System
- Role-Based Access Control (RBAC)
- Hierarchical permissions
- Permission checking ở middleware và components

### 8.5. Database Schema

#### 8.5.1. Main Schemas

- **`auth`**: Users, Roles, Permissions, UserRoles, RolePermissions
- **`hr`**: Employees, Employments, AcademicTitles, Trainings, Qualifications
- **`org`**: OrgUnits, OrgUnitRelations, OrgAssignments, OrgUnitTypes
- **`academic`**: Courses, Programs, Majors, Cohorts, CurriculumVersions
- **`schedule`**: AcademicTerms, ClassSections, InstructorAssignments
- **`student`**: Enrollments, GradeEntries, GradeItems
- **`finance`**: Invoices, TuitionRules
- **`notification`**: Notifications, NotificationTemplates, NotificationQueue
- **`public`**: Documents

#### 8.5.2. Key Models

- **User**: Người dùng hệ thống
- **Employee**: Nhân viên (liên kết với User)
- **OrgUnit**: Đơn vị tổ chức
- **Course**: Khóa học
- **Program**: Chương trình đào tạo
- **Major**: Chuyên ngành
- **Role**: Vai trò
- **Permission**: Quyền hạn

### 8.6. Styling Architecture

#### 8.6.1. Tailwind CSS
- Utility-first CSS
- Custom theme configuration
- Dark mode support
- Responsive design

#### 8.6.2. Material-UI
- Component library
- Theme customization
- Emotion integration

#### 8.6.3. CSS Organization
- Global styles: `src/app/globals.css`
- Component styles: Inline với Tailwind hoặc Emotion
- Theme variables: CSS custom properties

---

## 9. XỬ LÝ SỰ CỐ

### 9.1. Lỗi kết nối database

**Vấn đề**: Không thể kết nối đến PostgreSQL

**Giải pháp**:
1. Kiểm tra PostgreSQL đang chạy:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Kiểm tra DATABASE_URL trong `.env.local`
3. Kiểm tra firewall và port 5432
4. Kiểm tra credentials (username, password)

### 9.2. Lỗi Prisma Client

**Vấn đề**: `PrismaClient is not defined` hoặc schema errors

**Giải pháp**:
```bash
# Regenerate Prisma Client
npm run db:generate

# Reset database (cẩn thận - sẽ xóa dữ liệu)
npm run db:push -- --force-reset
```

### 9.3. Lỗi authentication

**Vấn đề**: Không thể đăng nhập

**Giải pháp**:
1. Kiểm tra NEXTAUTH_SECRET trong `.env.local`
2. Kiểm tra NEXTAUTH_URL
3. Kiểm tra user trong database
4. Kiểm tra password hash

### 9.4. Lỗi permissions

**Vấn đề**: Không có quyền truy cập routes

**Giải pháp**:
1. Kiểm tra user có roles và permissions
2. Kiểm tra middleware.ts có đúng permissions
3. Kiểm tra session có permissions

### 9.5. Lỗi build

**Vấn đề**: Build fails với TypeScript errors

**Giải pháp**:
1. Kiểm tra `next.config.ts` có `ignoreBuildErrors: true` (chỉ development)
2. Sửa TypeScript errors
3. Kiểm tra dependencies: `npm install`

### 9.6. Lỗi port đã được sử dụng

**Vấn đề**: Port 3000 đã được sử dụng

**Giải pháp**:
```bash
# Tìm process sử dụng port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Hoặc sử dụng port khác
PORT=3001 npm run dev
```

### 9.7. Lỗi Docker

**Vấn đề**: Docker container không start

**Giải pháp**:
1. Kiểm tra Docker đang chạy
2. Kiểm tra `docker-compose.yml`
3. Xem logs: `docker-compose logs`
4. Rebuild: `docker-compose build --no-cache`

### 9.8. Lỗi dependencies

**Vấn đề**: Module not found hoặc version conflicts

**Giải pháp**:
```bash
# Xóa node_modules và package-lock.json
rm -rf node_modules package-lock.json

# Cài đặt lại
npm install
```

### 9.9. Lỗi schema database

**Vấn đề**: Schema không tồn tại hoặc migration fails

**Giải pháp**:
1. Tạo schemas trong PostgreSQL:
   ```sql
   CREATE SCHEMA IF NOT EXISTS academic;
   CREATE SCHEMA IF NOT EXISTS auth;
   CREATE SCHEMA IF NOT EXISTS finance;
   CREATE SCHEMA IF NOT EXISTS hr;
   CREATE SCHEMA IF NOT EXISTS notification;
   CREATE SCHEMA IF NOT EXISTS org;
   CREATE SCHEMA IF NOT EXISTS report;
   CREATE SCHEMA IF NOT EXISTS schedule;
   CREATE SCHEMA IF NOT EXISTS student;
   ```

2. Chạy lại migration:
   ```bash
   npm run db:push
   ```

### 9.10. Lỗi memory

**Vấn đề**: Out of memory errors

**Giải pháp**:
1. Tăng Node.js memory limit:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run dev
   ```

2. Kiểm tra system resources
3. Đóng các ứng dụng khác

---

## PHỤ LỤC

### A. Scripts có sẵn

- `npm run dev`: Chạy development server
- `npm run build`: Build production
- `npm start`: Chạy production server
- `npm run lint`: Chạy ESLint
- `npm run db:generate`: Generate Prisma Client
- `npm run db:push`: Push schema to database
- `npm run db:migrate`: Run migrations
- `npm run db:studio`: Mở Prisma Studio

### B. Environment Variables

| Biến | Mô tả | Bắt buộc |
|------|-------|----------|
| DATABASE_URL | PostgreSQL connection string | Có |
| NEXTAUTH_URL | Application URL | Có |
| NEXTAUTH_SECRET | Secret key cho JWT | Có |
| NODE_ENV | Environment (development/production) | Không |

### C. Database Schemas

Hệ thống sử dụng 10 schemas:
1. `academic` - Dữ liệu học thuật
2. `auth` - Xác thực và phân quyền
3. `finance` - Tài chính
4. `hr` - Nhân sự
5. `notification` - Thông báo
6. `org` - Tổ chức
7. `public` - Dữ liệu công khai
8. `report` - Báo cáo
9. `schedule` - Lịch học
10. `student` - Sinh viên

### D. Tài liệu tham khảo

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Material-UI Documentation](https://mui.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### E. Liên hệ hỗ trợ

Nếu gặp vấn đề trong quá trình cài đặt, vui lòng:
1. Kiểm tra lại các bước cài đặt
2. Xem phần "Xử lý sự cố"
3. Kiểm tra logs trong console
4. Liên hệ team phát triển

---

**Phiên bản tài liệu**: 1.0  
**Ngày cập nhật**: 2024  
**Tác giả**: OpenAcademix Development Team

