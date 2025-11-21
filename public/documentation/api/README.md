# API Documentation

Tài liệu mô tả API Backend của hệ thống OpenAcademix.

## Nội dung

- [Syllabus API Spec](./syllabus-api-spec.md) - API cho quản lý đề cương học phần

## API Endpoints

### Authentication
- `/api/auth/*` - Xác thực người dùng

### User & Role Management
- `/api/users/*` - Quản lý người dùng
- `/api/roles/*` - Quản lý vai trò
- `/api/permissions/*` - Quản lý quyền

### Course & Curriculum
- `/api/tms/courses/*` - Quản lý học phần
- `/api/tms/programs/*` - Quản lý chương trình đào tạo
- `/api/tms/majors/*` - Quản lý ngành học

### Organization
- `/api/org/units/*` - Quản lý đơn vị tổ chức

### Human Resources
- `/api/hr/employees/*` - Quản lý nhân viên

### Finance
- `/api/finance/*` - Quản lý học phí

## API Examples

### cURL Examples
```bash
# Get courses
curl -X GET http://localhost:3000/api/tms/courses

# Create course
curl -X POST http://localhost:3000/api/tms/courses \
  -H "Content-Type: application/json" \
  -d '{"code": "CS101", "name_vi": "Lập trình cơ bản"}'
```

### Postman Collection
Postman collection sẽ được cập nhật trong tương lai.

