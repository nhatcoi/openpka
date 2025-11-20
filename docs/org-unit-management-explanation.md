# Giải thích Trang Quản Lý Cơ Cấu Tổ Chức

## 1. Tổng quan về Trang Quản Lý Cơ Cấu Tổ Chức

### 1.1. Trang "Trung tâm phê duyệt" (`/org/unit/review`)

Đây là trang chính để quản lý và phê duyệt các đơn vị tổ chức trong hệ thống. Trang này cho phép:
- Xem danh sách tất cả các đơn vị tổ chức
- Tìm kiếm và lọc theo trạng thái
- Xem chi tiết từng đơn vị
- Thực hiện các thao tác phê duyệt, kích hoạt, tạm dừng, v.v.
- Tạo đơn vị mới

### 1.2. Người dùng chính và Người quản lý chính

#### **Người dùng chính (Main Users):**

1. **Người tạo đơn vị (Creator)**
   - Có quyền: `org_unit.unit.create`, `org_unit.unit.update`
   - Có thể:
     - Tạo đơn vị mới
     - Chỉnh sửa đơn vị ở trạng thái DRAFT
     - Gửi đơn vị để xem xét (SUBMIT)
     - Hủy yêu cầu phê duyệt

2. **Người phê duyệt (Approver)**
   - Có quyền: `org_unit.unit.approve`
   - Có thể:
     - Phê duyệt đơn vị (APPROVE)
     - Từ chối đơn vị (REJECT)
     - Xem lịch sử phê duyệt

3. **Người kích hoạt (Activator)**
   - Có quyền: `org_unit.unit.activate`
   - Có thể:
     - Kích hoạt đơn vị đã được phê duyệt (ACTIVATE)
     - Kích hoạt lại đơn vị đã tạm dừng

4. **Người quản lý (Manager)**
   - Có quyền: `org_unit.unit.update`
   - Có thể:
     - Tạm dừng đơn vị đang hoạt động (SUSPEND)
     - Lưu trữ đơn vị (ARCHIVE)
     - Trả về đơn vị để chỉnh sửa (RETURN)

#### **Người quản lý chính (Main Manager):**

Người quản lý chính thường là:
- **Giám đốc (DIRECTOR)** - Cấp cao nhất
- **Trưởng đơn vị (ORG_MANAGER)** - Quản lý các đơn vị tổ chức
- **Trưởng khoa (DEAN)** - Quản lý các khoa
- **Trưởng bộ môn (DEPARTMENT_HEAD)** - Quản lý các bộ môn

Họ có đầy đủ các quyền để quản lý toàn bộ vòng đời của đơn vị tổ chức.

## 2. Khi tạo một tổ chức cần những gì?

### 2.1. Thông tin bắt buộc:

1. **Mã đơn vị (code)** - Bắt buộc
   - Mã định danh duy nhất cho đơn vị
   - Ví dụ: "IT", "HR", "FINANCE"

2. **Tên đơn vị (name)** - Bắt buộc
   - Tên đầy đủ của đơn vị
   - Ví dụ: "Phòng Công nghệ Thông tin", "Phòng Nhân sự"

3. **Loại đơn vị (type)** - Bắt buộc
   - Phân loại đơn vị (F, D, S, v.v.)
   - Được lấy từ danh sách loại đơn vị có sẵn trong hệ thống

### 2.2. Thông tin tùy chọn:

4. **Đơn vị chủ quản (parent_id)** - Tùy chọn
   - Đơn vị cha trong cây tổ chức
   - Nếu không chọn, đơn vị sẽ là đơn vị gốc

5. **Mô tả (description)** - Tùy chọn
   - Mô tả chi tiết về đơn vị

6. **Ngày dự kiến thành lập (planned_establishment_date)** - Tùy chọn
   - Ngày dự kiến đơn vị bắt đầu hoạt động
   - Nếu không có, hệ thống sẽ dùng ngày hiện tại

### 2.3. Quyền cần thiết:

Để tạo đơn vị, người dùng cần có quyền: **`org_unit.unit.create`**

## 3. Khi tạo xong một tổ chức, những điều gì xảy ra?

### 3.1. Quy trình tự động sau khi tạo:

1. **Tạo bản ghi đơn vị (OrgUnit)**
   - Đơn vị được tạo với trạng thái **DRAFT** (Bản nháp)
   - Các thông tin được lưu vào database:
     - `code`, `name`, `type`
     - `parent_id` (nếu có)
     - `description` (nếu có)
     - `planned_establishment_date` (nếu có)
     - `status: 'DRAFT'`
     - `effective_from`: Ngày dự kiến thành lập hoặc ngày hiện tại
     - `effective_to`: null (chưa có ngày kết thúc)

2. **Tạo Workflow Instance**
   - Hệ thống tự động tạo một workflow instance cho đơn vị
   - Workflow type: `ORG_UNIT`
   - Workflow này sẽ quản lý quá trình phê duyệt và kích hoạt đơn vị
   - Metadata bao gồm:
     - `org_unit_id`: ID của đơn vị
     - `code`: Mã đơn vị
     - `name`: Tên đơn vị
     - `request_details`: Chi tiết yêu cầu (nếu có)

3. **Tạo quan hệ với đơn vị cha (nếu có)**
   - Nếu có `parent_id`, hệ thống tạo bản ghi `OrgUnitRelation`
   - Quan hệ loại: `direct` (quan hệ trực tiếp)
   - `effective_from`: Ngày dự kiến thành lập hoặc ngày hiện tại
   - `effective_to`: null
   - `note`: "Initial parent-child relationship"

4. **Ghi nhận lịch sử (Audit Log)**
   - Hệ thống ghi lại thông tin:
     - `actorId`: ID người tạo
     - `actorName`: Tên người tạo
     - `action`: 'create_org_unit'
     - `metadata`: Thông tin về mã và tên đơn vị

### 3.2. Trạng thái ban đầu:

Sau khi tạo, đơn vị ở trạng thái **DRAFT** (Bản nháp), có thể:
- ✅ Chỉnh sửa thông tin
- ✅ Gửi xem xét (SUBMIT) → chuyển sang **REVIEWING**
- ❌ Chưa thể sử dụng trong hệ thống

### 3.3. Quy trình phê duyệt tiếp theo:

#### **Bước 1: DRAFT → REVIEWING**
- Người tạo hoặc người có quyền `org_unit.unit.update` gửi đơn vị để xem xét
- Đơn vị chuyển sang trạng thái **REVIEWING** (Đang xem xét)

#### **Bước 2: REVIEWING → APPROVED hoặc REJECTED**
- Người có quyền `org_unit.unit.approve` phê duyệt → **APPROVED** (Đã phê duyệt)
- Hoặc từ chối → **REJECTED** (Bị từ chối)
  - Nếu bị từ chối, người tạo có thể chỉnh sửa và gửi lại

#### **Bước 3: APPROVED → ACTIVE**
- Người có quyền `org_unit.unit.activate` kích hoạt đơn vị
- Đơn vị chuyển sang trạng thái **ACTIVE** (Đang hoạt động)
- **Lúc này đơn vị mới có thể được sử dụng trong hệ thống**

### 3.4. Các trạng thái khác:

- **SUSPENDED** (Tạm dừng): Đơn vị đang hoạt động bị tạm dừng
- **INACTIVE** (Không hoạt động): Đơn vị không còn hoạt động
- **ARCHIVED** (Đã lưu trữ): Đơn vị đã được lưu trữ, không thể chỉnh sửa

## 4. Tóm tắt quy trình

```
TẠO ĐƠN VỊ (DRAFT)
    ↓
[Gửi xem xét] → REVIEWING
    ↓
[Phê duyệt] → APPROVED
    ↓
[Kích hoạt] → ACTIVE ✅ (Có thể sử dụng)
```

## 5. Lưu ý quan trọng

1. **Đơn vị chỉ có thể sử dụng khi ở trạng thái ACTIVE**
2. **Mỗi bước trong quy trình đều được ghi lại trong lịch sử phê duyệt**
3. **Người tạo có thể hủy yêu cầu phê duyệt khi đơn vị ở trạng thái REVIEWING hoặc APPROVED**
4. **Quan hệ với đơn vị cha được tạo tự động nếu có parent_id**
5. **Workflow instance được tạo tự động để quản lý quá trình phê duyệt**

