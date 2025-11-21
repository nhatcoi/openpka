# Database Documentation

Tài liệu cơ sở dữ liệu của hệ thống OpenAcademix.

## Tổng quan

Hệ thống sử dụng PostgreSQL với cấu trúc schema-based:
- `academic` - Dữ liệu học thuật
- `auth` - Xác thực và phân quyền
- `finance` - Tài chính và học phí
- `hr` - Nhân sự
- `org` - Tổ chức
- `schedule` - Lịch học
- `student` - Sinh viên
- `workflow` - Quy trình phê duyệt

## Schema Diagram

Xem ERD trong thư mục [architecture/design](../architecture/design/).

## Migration Guide

Xem các file migration trong `prisma/migrations/`.

### Chạy migration
```bash
npx prisma migrate dev
```

### Tạo migration mới
```bash
npx prisma migrate dev --name migration_name
```

## Các bảng chính

### Academic Schema
- `courses` - Học phần
- `course_versions` - Phiên bản học phần
- `course_syllabus` - Đề cương chi tiết
- `programs` - Chương trình đào tạo
- `majors` - Ngành học
- `cohorts` - Khóa học

### Auth Schema
- `users` - Người dùng
- `roles` - Vai trò
- `permissions` - Quyền
- `user_role` - Phân quyền người dùng

### Org Schema
- `org_units` - Đơn vị tổ chức
- `org_unit_relation` - Quan hệ đơn vị
- `org_assignment` - Phân công nhân sự

### Finance Schema
- `tuition_credit_rates` - Biểu giá học phí
- `invoices` - Hóa đơn

## JSONB Fields

Một số bảng sử dụng JSONB để lưu trữ dữ liệu linh hoạt:
- `majors.metadata` - Metadata ngành học
- `course_syllabus.basic_info` - Thông tin cơ bản đề cương
- `course_syllabus.learning_outcomes` - Kết quả học tập
- `programs.plo` - Program Learning Outcomes

## Ràng buộc

- Foreign key constraints
- Unique constraints
- Check constraints
- Indexes cho performance

