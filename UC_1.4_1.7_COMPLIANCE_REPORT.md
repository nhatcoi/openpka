# Báo cáo đánh giá UC Compliance - UC-1.4 đến UC-1.7

## UC-1.4 – Xem danh sách đơn vị

### Yêu cầu UC:
- ✅ Hiển thị toàn bộ đơn vị theo dạng bảng
- ✅ Bao gồm: mã, tên, trạng thái, đơn vị cha, ngày tạo/cập nhật
- ✅ Tính năng: phân trang, tìm kiếm, chỉnh sửa, xem chi tiết
- ⚠️ **THIẾU**: Hiển thị "ngày cập nhật" trong bảng

### Implementation hiện tại:
**File**: `src/app/(org)/org/unit/page.tsx`
- ✅ Bảng hiển thị: Tên, Mã, Loại, Trạng thái, Đơn vị cha, Nhân viên, Ngày tạo
- ❌ **THIẾU**: Không có cột "Ngày cập nhật" (có field `updated_at` trong data)
- ✅ Phân trang: TablePagination component
- ✅ Tìm kiếm: Search field (tìm theo tên, mã, mô tả)
- ✅ Chỉnh sửa: Button Edit với dialog
- ✅ Xem chi tiết: Click vào tên đơn vị điều hướng đến `/org/unit/[id]`
- ✅ Sorting: Click vào header để sort theo tên, mã, ngày tạo

**File**: `src/app/api/org/units/route.ts` (GET)
- ✅ API hỗ trợ pagination, search, filtering
- ✅ Include parent unit data
- ✅ Sorting và pagination

### Kết luận UC-1.4:
**Status**: ⚠️ **PARTIAL MATCH**
- Thiếu cột "Ngày cập nhật" trong bảng
- Cần bổ sung cột `updated_at` vào table

---

## UC-1.5 – Tìm kiếm/Lọc đơn vị

### Yêu cầu UC:
- ✅ Lọc theo: tên, mã, trạng thái
- ❌ **THIẾU**: Lọc theo đơn vị cha
- ✅ Phân trang
- ✅ Hiển thị danh sách theo điều kiện

### Implementation hiện tại:
**File**: `src/app/(org)/org/unit/page.tsx`
- ✅ Search field: Tìm kiếm theo tên, mã, mô tả (search query)
- ✅ Filter dropdown: Loại đơn vị (type)
- ✅ Filter dropdown: Trạng thái (status)
- ❌ **THIẾU**: Không có filter dropdown cho "Đơn vị cha" (parent_id)
- ✅ Phân trang: TablePagination

**File**: `src/app/api/org/units/route.ts` (GET)
- ✅ API hỗ trợ filter: `search`, `status`, `type`, `parent_id`
- ✅ Có parameter `parent_id` trong API nhưng frontend không có UI để filter

### Kết luận UC-1.5:
**Status**: ⚠️ **PARTIAL MATCH**
- Thiếu filter UI cho "Đơn vị cha" (parent_id)
- Cần bổ sung dropdown filter cho đơn vị cha

---

## UC-1.6 – Thiết lập loại đơn vị (CRUD loại đơn vị)

### Yêu cầu UC:
- ✅ Thêm mới loại đơn vị
- ✅ Sửa loại đơn vị
- ✅ Xóa loại đơn vị (soft delete: set is_active = false)
- ✅ Không được xóa nếu loại đang được dùng
- ✅ Tên loại phải duy nhất

### Implementation hiện tại:
**File**: `src/app/(org)/org/type/page.tsx`
- ✅ Page quản lý loại đơn vị với CRUD đầy đủ
- ✅ Form thêm/sửa: code, name, description, color, sort_order, is_active
- ✅ Table hiển thị danh sách loại đơn vị
- ✅ Search functionality

**File**: `src/app/api/org/types/route.ts` (POST)
- ✅ Validation: Check duplicate code (case-insensitive)
- ✅ Validation: Check duplicate name
- ✅ Error messages tiếng Việt

**File**: `src/app/api/org/types/[id]/route.ts` (PUT)
- ✅ Validation: Check duplicate code nếu thay đổi
- ✅ Validation: Check duplicate name nếu thay đổi
- ✅ Error messages tiếng Việt

**File**: `src/app/api/org/types/[id]/route.ts` (DELETE)
- ✅ Check nếu loại đang được dùng: `SELECT COUNT(*) FROM org.org_units WHERE type = {code}`
- ✅ Nếu đang được dùng: Throw error với message tiếng Việt
- ✅ Soft delete: Set `is_active = false` thay vì hard delete

### Kết luận UC-1.6:
**Status**: ✅ **FULL MATCH**
- Tất cả yêu cầu đã được implement đầy đủ
- Duplicate check cho code và name
- Check đang được dùng trước khi xóa
- Soft delete implementation

---

## UC-1.7 – Thiết lập đơn vị trực thuộc

### Yêu cầu UC:
- ✅ Chọn đơn vị cha
- ✅ Chọn đơn vị con cần gán
- ❌ **THIẾU**: Kiểm tra ràng buộc (**1 đơn vị con chỉ thuộc 1 cha**)
- ⚠️ **CẦN LÀM RÕ**: Logic ràng buộc - trong schema có 2 cách thiết lập quan hệ:
  1. Field `parent_id` trong `OrgUnit` (direct parent-child)
  2. Table `OrgUnitRelation` (quan hệ mềm với effective dates)
- ✅ Lưu + ghi log (history tracking)

### Implementation hiện tại:
**File**: `src/app/(org)/org/unit-relations/page.tsx`
- ✅ Page quản lý quan hệ đơn vị
- ✅ Form thêm quan hệ: Chọn parent, child, relation_type, effective dates
- ✅ Table hiển thị quan hệ parent-child
- ✅ CRUD đầy đủ cho relations

**File**: `src/app/api/org/unit-relations/route.ts` (POST)
- ✅ Validation: Required fields (parent_id, child_id, relation_type, effective_from)
- ❌ **THIẾU**: Không check ràng buộc "1 đơn vị con chỉ thuộc 1 cha"
- ⚠️ **VẤN ĐỀ**: Schema có thể có nhiều relations với cùng child_id nhưng khác parent_id, relation_type, effective_from
- ❌ **THIẾU**: Không có history logging cho relations

**File**: `prisma/schema.prisma`
- Schema `OrgUnit` có field `parent_id` (BigInt?)
- Schema `OrgUnitRelation` có composite key: [parent_id, child_id, relation_type, effective_from]
- **VẤN ĐỀ**: Có thể có nhiều relations với cùng child_id nhưng khác parent_id hoặc relation_type

### Kết luận UC-1.7:
**Status**: ❌ **NOT MATCH**
- Thiếu validation check ràng buộc: "1 đơn vị con chỉ thuộc 1 cha"
- Cần bổ sung logic:
  1. Khi tạo relation mới, check xem child_id đã có parent_id active không (trong OrgUnit hoặc OrgUnitRelation)
  2. Nếu đã có parent, throw error
  3. Hoặc phải update parent_id trong OrgUnit khi tạo relation (nếu UC yêu cầu 1-1 relationship)
- Thiếu history logging cho relations

---

## Tổng kết

### Đã match đầy đủ:
1. ✅ UC-1.6: CRUD loại đơn vị với duplicate check và validation

### Partial match (thiếu một số phần):
1. ⚠️ UC-1.4: Thiếu cột "Ngày cập nhật" trong bảng
2. ⚠️ UC-1.5: Thiếu filter UI cho "Đơn vị cha"

### Chưa match:
1. ❌ UC-1.7: Thiếu validation ràng buộc "1 đơn vị con chỉ thuộc 1 cha"

### Recommendations:

1. **UC-1.4**: Thêm cột "Ngày cập nhật" vào bảng `/org/unit/page.tsx`

2. **UC-1.5**: Thêm filter dropdown cho "Đơn vị cha" trong `/org/unit/page.tsx`

3. **UC-1.7**: Bổ sung validation:
   - Check xem child_id đã có parent_id active không (trong OrgUnit hoặc OrgUnitRelation với effective_from <= now AND (effective_to IS NULL OR effective_to >= now))
   - Nếu đã có parent active, throw error với message: "Đơn vị con đã thuộc về một đơn vị cha khác. Một đơn vị con chỉ có thể thuộc một đơn vị cha tại một thời điểm."
   - Thêm history logging cho relations (nếu cần)

