## 2. Chi tiết thiết kế – Hệ thống OpenAcademix

Tài liệu này mô tả thiết kế mức logic cho các phân hệ cốt lõi của OpenAcademix nhằm phục vụ báo cáo học phần Yêu cầu phần mềm. Mỗi phần đều đính kèm tệp PlantUML (`.puml`) nằm trong thư mục `docs/design` để thuận tiện tái sử dụng khi xuất hình ảnh (thông qua PlantUML hoặc Kroki).

### 2.1 Sơ đồ tuần tự

#### 2.1.1 Luồng tạo mới học phần (TMS)

- **Tệp sơ đồ**: `docs/design/sequence-course-create.puml`
- **Mục tiêu**: mô tả cách chuyên viên đào tạo sử dụng màn hình `/tms/courses/create` để khởi tạo học phần mới cùng syllabus nháp và sinh workflow phê duyệt.

**Diễn giải tóm tắt**

1. Người dùng nhập thông tin học phần (mã, tên, số tín chỉ, khối kiến thức, mô tả) trên UI Next.js.
2. UI thực hiện kiểm tra phía client (bắt buộc, định dạng) trước khi gọi API `POST /api/tms/courses`.
3. API chuyển yêu cầu tới `CourseService` để xác thực nghiệp vụ, kiểm tra trùng mã và chuẩn hóa payload.
4. Service mở transaction, ghi vào `courses` và `course_syllabi` (draft), đồng thời yêu cầu `WorkflowService` tạo instance phê duyệt loại `COURSE`.
5. Workflow lưu `workflow_instances`, `approval_records` trạng thái `PENDING`, trả về `workflowInstanceId`.
6. Transaction commit, API phản hồi 201 kèm DTO và trạng thái workflow, UI hiển thị thông báo thành công.
7. Nhánh lỗi (400) xảy ra khi payload thiếu dữ liệu hoặc đã trùng mã; UI hiển thị thông báo cụ thể.

#### 2.1.2 Luồng cập nhật đơn giá học phí (Finance)

- **Tệp sơ đồ**: `docs/design/sequence-finance-tuition.puml`
- **Mục tiêu**: mô tả xử lý nghiệp vụ khi chuyên viên tài chính nhập đơn giá tín chỉ theo CTĐT/năm học, bao gồm cơ chế phát hiện xung đột và xác nhận ghi đè (`force=true`).

**Diễn giải tóm tắt**

1. Người dùng chọn CTĐT, năm học và nhập đơn giá trên giao diện `/finance`.
2. UI kiểm tra định dạng số và gọi `POST /api/finance/tuition-rates` (force mặc định `false`).
3. `TuitionService` truy vấn bản ghi hiện hành. Nếu đã tồn tại, `ConflictPolicy` trả về 409 yêu cầu xác nhận ghi đè.
4. UI hiển thị modal, người dùng chọn “Ghi đè” ⇒ gửi lại request với `force=true`.
5. Service thực hiện transaction UPSERT bảng `tuition_rates`, đồng thời ghi `tuition_rate_history`.
6. API trả 200 cùng dữ liệu hiện hành; UI refresh bảng đơn giá hiện tại và lịch sử 5 năm.
7. Trường hợp DB lỗi kết nối → trả 503, UI hiển thị banner cảnh báo và giữ nguyên dữ liệu cũ.

### 2.2 Biểu đồ lớp UML

- **Tệp sơ đồ**: `docs/design/class-diagram-core.puml`
- **Phạm vi**: các thực thể nghiệp vụ chính của hệ thống (Org, HR, TMS, Finance) và mối liên hệ bảo mật/approval.

**Các nhóm lớp chính**

1. **Bảo mật & định danh**: `User`, `Role`, `Permission`, `UserRole`, `RolePermission` bảo đảm triển khai RBAC chi tiết cho từng module. Tất cả hành động phê duyệt trong workflow đều ghi nhận `actorId` về `User`.
2. **Cơ cấu tổ chức**: `OrgUnit` và `OrgUnitRelation` mô tả cây đơn vị, hỗ trợ nhiều loại quan hệ (direct, affiliation) với thời gian hiệu lực.
3. **Đào tạo (TMS)**: `Course`, `CourseSyllabus`, `Curriculum` thể hiện cấu trúc CTĐT; `Course` có đúng một syllabus hiện hành, `Curriculum` chứa nhiều học phần và liên kết với `TuitionRate`.
4. **Tài chính**: `TuitionRate` gắn với CTĐT + năm học, được version hóa thông qua bảng lịch sử (không thể hiện trong sơ đồ để tránh quá tải).
5. **Workflow phê duyệt**: `WorkflowInstance` kết nối tới tài nguyên cụ thể (OrgUnit, Course, TuitionRate, …); `ApprovalRecord` lưu chi tiết từng hành động (approve/reject/request_edit).

**Ghi chú triển khai**

- Mỗi lớp tương ứng với bảng trong schema Prisma. Các trường kiểu enum (`OrgUnitStatus`, `WorkflowStatus`, …) được định nghĩa trong `schema.prisma`.
- Tất cả quan hệ nhiều-nhiều (UserRole, RolePermission) được triển khai thông qua bảng trung gian, hỗ trợ transaction khi cập nhật phân quyền.
- Biểu đồ phản ánh kiến trúc logic; các lớp trình bày ở tầng service (CourseService, WorkflowService, …) không đưa vào sơ đồ lớp để giữ trọng tâm dữ liệu.

> Khi cần xuất hình ảnh cho báo cáo, sử dụng công cụ PlantUML: `plantuml docs/design/*.puml`. Mọi cập nhật mới phải đồng bộ cả file `.puml` và mô tả trong tài liệu để tránh lệch thông tin.

