# Use Cases

Đặc tả nghiệp vụ và các use case của hệ thống OpenAcademix.

## Nội dung

- [Syllabus Use Cases](./syllabus-use-cases.md) - Use cases cho quản lý đề cương học phần

## Use Case Diagram

Xem các biểu đồ use case trong thư mục [architecture/design](../architecture/design/).

## Danh sách Use Cases

### UC-1: Tạo tổ chức
**Mô tả**: Tạo mới một đơn vị tổ chức trong hệ thống.

**Actors**: Quản trị viên hệ thống

**Preconditions**: 
- Người dùng đã đăng nhập
- Có quyền tạo đơn vị tổ chức

**Main Flow**:
1. Người dùng điền thông tin đơn vị
2. Hệ thống validate dữ liệu
3. Hệ thống tạo đơn vị mới
4. Hệ thống ghi log

### UC-4: Quản lý học phí
**Mô tả**: Thiết lập và quản lý biểu giá học phí.

**Actors**: Quản trị viên tài chính

### UC-7: Đăng ký học
**Mô tả**: Sinh viên đăng ký học phần.

**Actors**: Sinh viên

### UC-10: Quản lý hồ sơ sinh viên
**Mô tả**: Quản lý thông tin và hồ sơ sinh viên.

**Actors**: Nhân viên phòng đào tạo

