# Quy trình Trạng thái Phê duyệt Đơn vị Tổ chức

## Tổng quan

Quy trình phê duyệt đơn vị tổ chức bao gồm các trạng thái và hành động tương ứng, cho phép quản lý vòng đời của đơn vị từ khi tạo bản nháp đến khi kích hoạt hoặc tạm dừng.

## Các Trạng thái (Status)

### 1. **DRAFT** (Bản nháp)
- **Mô tả**: Đơn vị mới được tạo, đang ở giai đoạn soạn thảo
- **Màu sắc**: Default (Xám)
- **Vị trí trong workflow**: Bước 0 - Soạn thảo

### 2. **REVIEWING** (Đang xem xét)
- **Mô tả**: Đơn vị đã được gửi để xem xét phê duyệt
- **Màu sắc**: Info (Xanh dương)
- **Vị trí trong workflow**: Bước 1 - Đang xem xét

### 3. **APPROVED** (Đã phê duyệt)
- **Mô tả**: Đơn vị đã được phê duyệt nhưng chưa kích hoạt
- **Màu sắc**: Success (Xanh lá)
- **Vị trí trong workflow**: Bước 2 - Đã phê duyệt

### 4. **ACTIVE** (Đang hoạt động)
- **Mô tả**: Đơn vị đã được kích hoạt và đang hoạt động
- **Màu sắc**: Success (Xanh lá)
- **Vị trí trong workflow**: Bước 3 - Đã kích hoạt (Published)

### 5. **REJECTED** (Bị từ chối)
- **Mô tả**: Đơn vị bị từ chối trong quá trình xem xét
- **Màu sắc**: Error (Đỏ)
- **Vị trí trong workflow**: Quay lại DRAFT

### 6. **SUSPENDED** (Tạm dừng)
- **Mô tả**: Đơn vị đang hoạt động nhưng bị tạm dừng
- **Màu sắc**: Warning (Vàng/Cam)
- **Vị trí trong workflow**: Ngoài quy trình chính

### 7. **INACTIVE** (Không hoạt động)
- **Mô tả**: Đơn vị không hoạt động, có thể được kích hoạt lại
- **Màu sắc**: Default (Xám)
- **Vị trí trong workflow**: Ngoài quy trình chính

## Các Hành động (Actions) theo Trạng thái

### **DRAFT** → Actions có thể thực hiện:
1. **SUBMIT** (Gửi xem xét)
   - **Permission**: `org_unit.unit.update`
   - **Chuyển sang**: `REVIEWING`
   - **Mô tả**: Gửi đơn vị để được xem xét phê duyệt

### **REVIEWING** → Actions có thể thực hiện:
1. **APPROVE** (Phê duyệt)
   - **Permission**: `org_unit.unit.approve`
   - **Chuyển sang**: `APPROVED`
   - **Mô tả**: Phê duyệt đơn vị, cho phép kích hoạt

2. **REJECT** (Từ chối)
   - **Permission**: `org_unit.unit.approve`
   - **Chuyển sang**: `REJECTED`
   - **Mô tả**: Từ chối đơn vị, cần chỉnh sửa lại

3. **RETURN** (Trả về)
   - **Permission**: `org_unit.unit.update`
   - **Chuyển sang**: `DRAFT`
   - **Mô tả**: Trả về bản nháp để chỉnh sửa thêm

### **APPROVED** → Actions có thể thực hiện:
1. **ACTIVATE** (Kích hoạt)
   - **Permission**: `org_unit.unit.activate`
   - **Chuyển sang**: `ACTIVE`
   - **Mô tả**: Kích hoạt đơn vị để bắt đầu hoạt động

2. **RETURN** (Trả về)
   - **Permission**: `org_unit.unit.update`
   - **Chuyển sang**: `DRAFT`
   - **Mô tả**: Trả về bản nháp để chỉnh sửa lại

### **ACTIVE** → Actions có thể thực hiện:
1. **SUSPEND** (Tạm dừng)
   - **Permission**: `org_unit.unit.update`
   - **Chuyển sang**: `SUSPENDED`
   - **Mô tả**: Tạm dừng hoạt động của đơn vị

### **REJECTED** → Actions có thể thực hiện:
1. **SUBMIT** (Gửi xem xét lại)
   - **Permission**: `org_unit.unit.update`
   - **Chuyển sang**: `REVIEWING`
   - **Mô tả**: Sau khi chỉnh sửa, gửi lại để xem xét

### **SUSPENDED** → Actions có thể thực hiện:
1. **ACTIVATE** (Kích hoạt lại)
   - **Permission**: `org_unit.unit.activate`
   - **Chuyển sang**: `ACTIVE`
   - **Mô tả**: Kích hoạt lại đơn vị sau khi tạm dừng

### **INACTIVE** → Actions có thể thực hiện:
1. **ACTIVATE** (Kích hoạt)
   - **Permission**: `org_unit.unit.activate`
   - **Chuyển sang**: `ACTIVE`
   - **Mô tả**: Kích hoạt đơn vị không hoạt động

## Sơ đồ Quy trình

```
                    ┌─────────┐
                    │  DRAFT  │
                    └────┬────┘
                         │ SUBMIT
                         ▼
                 ┌──────────────┐
                 │  REVIEWING   │◄─────┐
                 └───┬──────┬───┘      │
                     │      │          │
          APPROVE    │      │ REJECT   │ RETURN
                     │      │          │
                     ▼      ▼          │
                ┌─────────┐  ┌─────────┐
                │APPROVED │  │REJECTED │
                └────┬────┘  └────┬────┘
                     │             │
          ACTIVATE   │             │ SUBMIT
                     │             │
                     ▼             │
                ┌─────────┐        │
                │ ACTIVE  │◄───────┘
                └────┬────┘
                     │
          SUSPEND    │
                     ▼
                ┌──────────┐
                │SUSPENDED │
                └────┬─────┘
                     │
          ACTIVATE   │
                     ▼
                ┌─────────┐
                │ ACTIVE  │
                └─────────┘

         ┌──────────────┐
         │  INACTIVE    │
         └──────┬───────┘
                │
         ACTIVATE│
                ▼
         ┌─────────┐
         │ ACTIVE  │
         └─────────┘
```

## Quyền Hạn (Permissions)

### `org_unit.unit.update`
- Cho phép: SUBMIT, RETURN, SUSPEND
- Dùng cho: Người tạo, người chỉnh sửa đơn vị

### `org_unit.unit.approve`
- Cho phép: APPROVE, REJECT
- Dùng cho: Người phê duyệt đơn vị

### `org_unit.unit.activate`
- Cho phép: ACTIVATE
- Dùng cho: Người có quyền kích hoạt đơn vị

## Gợi ý Cải thiện

### 1. **Thêm trạng thái ARCHIVED**
- **Mục đích**: Lưu trữ các đơn vị không còn sử dụng
- **Actions**: 
  - Từ ACTIVE/INACTIVE → ARCHIVE (Lưu trữ)
  - Từ ARCHIVED → Không có action (chỉ có thể xem lịch sử)

### 2. **Thêm action EDIT cho DRAFT và REJECTED**
- **Mục đích**: Cho phép chỉnh sửa thông tin đơn vị
- **Note**: Hiện tại chỉ có thể chỉnh sửa qua detail page

### 3. **Thêm action CANCEL cho REVIEWING và APPROVED**
- **Mục đích**: Hủy bỏ yêu cầu phê duyệt, quay về DRAFT
- **Permission**: `org_unit.unit.update` (người tạo mới có thể hủy)

### 4. **Thêm workflow notes cho mỗi action**
- **Mục đích**: Ghi chú lý do thực hiện action
- **Hiện tại**: Đã có `workflow_notes` trong API nhưng có thể cải thiện UI

### 5. **Thêm notification system**
- **Mục đích**: Thông báo khi đơn vị chuyển trạng thái
- **Người nhận**: 
  - Người tạo khi được APPROVE/REJECT
  - Người phê duyệt khi có đơn vị mới REVIEWING

## Lưu ý Kỹ thuật

1. **Constraint đã được xóa**: Check constraint `org_units_status_check_new` đã được xóa để cho phép quản lý status linh hoạt hơn thông qua bảng `org_unit_statuses`

2. **Status mapping**: Một số status được map sang workflow stage:
   - `DRAFT` → DRAFT stage
   - `REVIEWING` → REVIEWING stage
   - `APPROVED` → APPROVED stage
   - `ACTIVE` → PUBLISHED stage
   - `REJECTED`, `SUSPENDED`, `INACTIVE` → DRAFT stage (để hiển thị trong progress bar)

3. **History tracking**: Tất cả actions đều được ghi lại trong:
   - `workflow.workflow_instances` và `workflow.approval_records` (workflow history)
   - `org.org_unit_history` (organizational history với change details)

