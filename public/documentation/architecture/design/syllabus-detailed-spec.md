# Đề cương chi tiết cho học phần - Đặc tả nghiệp vụ và kỹ thuật

## 1. NGHIỆP VỤ (Business Logic)

### 1.1. Mục đích
Hệ thống cần hỗ trợ xây dựng đề cương chi tiết cho từng học phần, bao gồm:
- Chi tiết nội dung học tập theo từng tuần
- Mục tiêu học tập cụ thể cho từng tuần
- Tài liệu học tập và tài nguyên
- Bài tập và nhiệm vụ học tập
- Phương pháp giảng dạy
- Thời lượng và phân bổ thời gian

### 1.2. Quy trình nghiệp vụ

#### 1.2.1. Tạo đề cương mới
1. Giảng viên/Bộ môn tạo học phần mới hoặc chỉnh sửa học phần hiện có
2. Điền thông tin cơ bản: tên, mã, số tín chỉ, mô tả
3. Xác định mục tiêu học tập tổng thể
4. Xây dựng đề cương chi tiết theo tuần:
   - Xác định số tuần học (thường 10-16 tuần)
   - Phân bổ nội dung học tập cho từng tuần
   - Xác định mục tiêu học tập cho từng tuần
   - Liệt kê tài liệu và tài nguyên
   - Giao bài tập và nhiệm vụ
5. Xem xét và chỉnh sửa
6. Gửi duyệt (nếu cần)

#### 1.2.2. Gợi ý đề cương tự động
1. Hệ thống phân tích thông tin học phần:
   - Tên môn học (tiếng Việt, tiếng Anh)
   - Số tín chỉ và phân bổ (lý thuyết/thực hành)
   - Loại môn học (lý thuyết/thực hành/hỗn hợp)
   - Mục tiêu học tập tổng thể
   - Mô tả môn học
2. Hệ thống gợi ý đề cương dựa trên:
   - Template theo loại môn học
   - Phân tích từ khóa trong tên môn
   - Số tín chỉ để tính số tuần
   - Mục tiêu học tập để phân bổ nội dung
3. Giảng viên xem xét, chỉnh sửa và áp dụng

#### 1.2.3. Quản lý phiên bản đề cương
1. Mỗi học phần có thể có nhiều phiên bản đề cương
2. Mỗi phiên bản gắn với một CourseVersion
3. Lưu lịch sử thay đổi
4. So sánh giữa các phiên bản

### 1.3. Quy tắc nghiệp vụ

#### 1.3.1. Ràng buộc
- Số tuần học phải phù hợp với số tín chỉ:
  - 2-3 tín chỉ: 8-10 tuần
  - 4 tín chỉ: 10-12 tuần
  - 5-6 tín chỉ: 12-15 tuần
  - 7+ tín chỉ: 15-16 tuần
- Tổng thời lượng (số giờ) phải phù hợp với số tín chỉ:
  - 1 tín chỉ lý thuyết = 15 giờ
  - 1 tín chỉ thực hành = 30 giờ
- Mỗi tuần phải có ít nhất: chủ đề, mục tiêu tuần
- Tuần cuối thường là tuần kiểm tra/thi

#### 1.3.2. Quyền hạn
- Giảng viên: Tạo, chỉnh sửa đề cương của học phần mình phụ trách
- Trưởng bộ môn: Xem, duyệt đề cương trong bộ môn
- Phòng đào tạo: Xem tất cả, duyệt đề cương
- Sinh viên: Xem đề cương đã được duyệt

### 1.4. Tính năng gợi ý thông minh

#### 1.4.1. Phân loại môn học
Hệ thống nhận diện loại môn học dựa trên từ khóa:
- **Lập trình**: "lập trình", "programming", "coding"
- **Cơ sở dữ liệu**: "cơ sở dữ liệu", "database", "sql"
- **Mạng máy tính**: "mạng", "network", "networking"
- **Toán học**: "toán", "math", "mathematics"
- **Kinh tế/Quản trị**: "kinh tế", "economics", "quản trị", "management"
- **Ngoại ngữ**: "tiếng anh", "english", "ngoại ngữ"
- **Khoa học tự nhiên**: "hóa", "chemistry", "vật lý", "physics"
- **Khác**: Gợi ý chung

#### 1.4.2. Template đề cương
Mỗi loại môn học có template đề cương mẫu với:
- Cấu trúc chủ đề điển hình
- Phân bổ thời gian hợp lý
- Mục tiêu học tập theo từng giai đoạn
- Tài liệu tham khảo điển hình

## 2. USE CASES (UC)

### UC-1: Tạo đề cương chi tiết thủ công
**Actor**: Giảng viên, Trưởng bộ môn

**Preconditions**:
- Học phần đã được tạo với thông tin cơ bản
- Người dùng có quyền chỉnh sửa học phần

**Main Flow**:
1. Người dùng chọn học phần cần tạo đề cương
2. Hệ thống hiển thị form tạo đề cương
3. Người dùng nhập số tuần học
4. Với mỗi tuần, người dùng nhập:
   - Số tuần
   - Chủ đề
   - Mục tiêu tuần
   - Tài liệu học tập
   - Bài tập/Nhiệm vụ
   - Phương pháp giảng dạy (tùy chọn)
   - Thời lượng (giờ)
   - Đánh dấu tuần thi (nếu có)
5. Người dùng có thể thêm/xóa/sắp xếp lại các tuần
6. Người dùng lưu đề cương
7. Hệ thống lưu đề cương và hiển thị thông báo thành công

**Alternative Flows**:
- 4a. Người dùng có thể tải lên file đính kèm cho từng tuần
- 6a. Nếu thiếu thông tin bắt buộc, hệ thống hiển thị cảnh báo

**Postconditions**:
- Đề cương được lưu vào database
- Học phần có thể được gửi duyệt

---

### UC-2: Gợi ý đề cương tự động
**Actor**: Giảng viên, Trưởng bộ môn

**Preconditions**:
- Học phần đã có thông tin cơ bản (tên, số tín chỉ)
- Có thể có hoặc chưa có mục tiêu học tập

**Main Flow**:
1. Người dùng chọn học phần và mở tính năng "Gợi ý đề cương"
2. Hệ thống hiển thị dialog gợi ý với thông tin học phần
3. Người dùng chọn số tuần học (8, 10, 12, 14, 15, 16)
4. Người dùng nhấn "Tạo đề cương gợi ý"
5. Hệ thống phân tích thông tin học phần:
   - Phân tích tên môn để xác định loại
   - Tính số tuần dựa trên số tín chỉ
   - Phân tích mục tiêu học tập
6. Hệ thống tạo đề cương gợi ý dựa trên template
7. Hệ thống hiển thị đề cương gợi ý để xem trước
8. Người dùng xem xét và có thể chỉnh sửa
9. Người dùng chọn cách áp dụng:
   - Áp dụng (thêm mới)
   - Bổ sung vào đề cương hiện có
   - Thay thế toàn bộ
10. Hệ thống áp dụng đề cương theo lựa chọn
11. Hệ thống hiển thị thông báo thành công

**Alternative Flows**:
- 5a. Nếu thiếu thông tin, hệ thống sử dụng giá trị mặc định
- 8a. Người dùng có thể hủy và không áp dụng

**Postconditions**:
- Đề cương gợi ý được áp dụng (nếu người dùng chọn)
- Người dùng có thể tiếp tục chỉnh sửa

---

### UC-3: Chỉnh sửa đề cương
**Actor**: Giảng viên, Trưởng bộ môn

**Preconditions**:
- Đề cương đã được tạo
- Người dùng có quyền chỉnh sửa

**Main Flow**:
1. Người dùng mở học phần và chọn xem/chỉnh sửa đề cương
2. Hệ thống hiển thị đề cương hiện tại
3. Người dùng chỉnh sửa thông tin các tuần:
   - Sửa chủ đề, mục tiêu, tài liệu, bài tập
   - Thêm/xóa tuần
   - Sắp xếp lại thứ tự tuần
4. Người dùng lưu thay đổi
5. Hệ thống lưu và hiển thị thông báo

**Alternative Flows**:
- 3a. Người dùng có thể sao chép một tuần để tạo tuần mới
- 4a. Nếu có thay đổi lớn, hệ thống đề xuất tạo phiên bản mới

**Postconditions**:
- Đề cương được cập nhật
- Lịch sử thay đổi được ghi nhận (nếu có)

---

### UC-4: Xem đề cương
**Actor**: Tất cả người dùng (tùy quyền)

**Preconditions**:
- Đề cương đã được tạo
- Người dùng có quyền xem

**Main Flow**:
1. Người dùng mở học phần
2. Người dùng chọn xem đề cương
3. Hệ thống hiển thị đề cương chi tiết:
   - Danh sách các tuần học
   - Thông tin chi tiết từng tuần
   - Tài liệu đính kèm (nếu có)
4. Người dùng có thể:
   - Xem chi tiết từng tuần
   - Tải xuống tài liệu
   - In đề cương (nếu có quyền)

**Alternative Flows**:
- 3a. Nếu có nhiều phiên bản, người dùng chọn phiên bản để xem
- 3b. Người dùng có thể so sánh các phiên bản

**Postconditions**:
- Người dùng đã xem đề cương

---

### UC-5: Quản lý phiên bản đề cương
**Actor**: Giảng viên, Trưởng bộ môn, Phòng đào tạo

**Preconditions**:
- Học phần đã có ít nhất một phiên bản đề cương

**Main Flow**:
1. Người dùng mở học phần
2. Người dùng chọn xem lịch sử phiên bản
3. Hệ thống hiển thị danh sách các phiên bản:
   - Số phiên bản
   - Ngày tạo
   - Người tạo
   - Trạng thái
4. Người dùng chọn một phiên bản để xem chi tiết
5. Người dùng có thể:
   - Xem chi tiết phiên bản
   - So sánh với phiên bản khác
   - Khôi phục phiên bản cũ (nếu có quyền)
   - Tạo phiên bản mới dựa trên phiên bản hiện tại

**Postconditions**:
- Người dùng đã xem/quản lý phiên bản

---

### UC-6: Xuất đề cương
**Actor**: Giảng viên, Trưởng bộ môn, Phòng đào tạo

**Preconditions**:
- Đề cương đã được tạo

**Main Flow**:
1. Người dùng mở đề cương
2. Người dùng chọn xuất đề cương
3. Hệ thống hiển thị các tùy chọn:
   - Định dạng (PDF, Word, Excel)
   - Bao gồm tài liệu đính kèm (có/không)
4. Người dùng chọn tùy chọn và nhấn "Xuất"
5. Hệ thống tạo file và cho phép tải xuống

**Postconditions**:
- File đề cương được tạo và tải xuống

## 3. DATABASE SCHEMA

### 3.1. Schema hiện tại

Hiện tại hệ thống đã có:
- `Course`: Thông tin cơ bản học phần
- `CourseVersion`: Phiên bản học phần
- `CourseSyllabus`: Đề cương (lưu dạng JSONB)
- `CourseContent`: Nội dung học phần (mục tiêu, đánh giá)

### 3.2. Đề xuất cải tiến Schema

#### 3.2.1. Cải tiến bảng `course_syllabus`

**Vấn đề hiện tại**:
- Lưu toàn bộ đề cương trong một JSONB field, khó query và index
- Khó tìm kiếm theo chủ đề, tuần học
- Khó thống kê và báo cáo

**Đề xuất**: Giữ nguyên JSONB cho tính linh hoạt, nhưng bổ sung thêm các trường metadata và index

```prisma
model CourseSyllabus {
  id                BigInt         @id @default(autoincrement())
  course_version_id BigInt?
  
  // Metadata để query nhanh
  total_weeks       Int?           // Tổng số tuần
  total_hours       Decimal?        @db.Decimal(6, 2) // Tổng số giờ
  has_exam_week     Boolean?       @default(false) // Có tuần thi không
  exam_week_number  Int?           // Tuần thi (nếu có)
  
  // Dữ liệu chi tiết (JSONB)
  syllabus_data     Json?          @db.JsonB
  
  // Metadata bổ sung
  template_used     String?       @db.VarChar(100) // Template đã sử dụng (nếu dùng gợi ý)
  is_auto_generated Boolean?       @default(false) // Có phải tự động tạo không
  generation_metadata Json?        @db.JsonB // Metadata về quá trình tạo (nếu tự động)
  
  // Audit
  created_by        BigInt?
  updated_by        BigInt?
  created_at        DateTime?      @default(now()) @db.Timestamptz(6)
  updated_at        DateTime?      @default(now()) @db.Timestamptz(6)
  
  // Relations
  course_versions   CourseVersion? @relation(fields: [course_version_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  
  @@index([course_version_id], map: "idx_course_syllabus_course_version_id")
  @@index([total_weeks], map: "idx_course_syllabus_total_weeks")
  @@index([has_exam_week], map: "idx_course_syllabus_has_exam_week")
  @@index([is_auto_generated], map: "idx_course_syllabus_auto_generated")
  @@map("course_syllabus")
  @@schema("academic")
}
```

#### 3.2.2. Cấu trúc JSONB `syllabus_data`

```typescript
interface SyllabusData {
  version: string; // Phiên bản cấu trúc dữ liệu
  weeks: SyllabusWeek[];
  metadata?: {
    created_by_template?: string;
    auto_generated?: boolean;
    generation_date?: string;
  };
}

interface SyllabusWeek {
  week_number: number;           // Số tuần (1, 2, 3, ...)
  topic: string;                 // Chủ đề tuần
  objectives: string;             // Mục tiêu tuần (có thể là array hoặc string)
  teaching_methods?: string;      // Phương pháp giảng dạy
  materials: string;              // Tài liệu học tập
  assignments: string;            // Bài tập/Nhiệm vụ
  duration_hours?: number;         // Thời lượng (giờ)
  is_exam_week?: boolean;         // Có phải tuần thi không
  is_midterm_week?: boolean;      // Có phải tuần giữa kỳ không
  attachments?: SyllabusAttachment[]; // File đính kèm
  notes?: string;                 // Ghi chú
}

interface SyllabusAttachment {
  id: string;                     // ID file (có thể là UUID hoặc file path)
  name: string;                   // Tên file
  type: string;                   // Loại file (pdf, doc, ppt, ...)
  size?: number;                  // Kích thước (bytes)
  url?: string;                   // URL để tải xuống
  uploaded_at?: string;           // Ngày tải lên
}
```

#### 3.2.3. Bảng mới: `syllabus_templates` (Tùy chọn)

Nếu muốn lưu template để tái sử dụng:

```prisma
model SyllabusTemplate {
  id                BigInt    @id @default(autoincrement())
  name              String    @db.VarChar(255)
  description       String?
  course_type       String?   @db.VarChar(50) // Loại môn học
  keywords          String[]  // Từ khóa để nhận diện
  template_data     Json      @db.JsonB // Cấu trúc template
  is_active         Boolean   @default(true)
  usage_count       Int       @default(0) // Số lần sử dụng
  created_by        BigInt?
  created_at        DateTime  @default(now()) @db.Timestamptz(6)
  updated_at        DateTime  @default(now()) @db.Timestamptz(6)
  
  @@index([course_type], map: "idx_syllabus_template_course_type")
  @@index([is_active], map: "idx_syllabus_template_active")
  @@map("syllabus_templates")
  @@schema("academic")
}
```

#### 3.2.4. Bảng mới: `syllabus_attachments` (Nếu cần quản lý file riêng)

```prisma
model SyllabusAttachment {
  id                BigInt    @id @default(autoincrement())
  course_syllabus_id BigInt
  week_number       Int?      // Tuần nào (null nếu là file chung)
  file_name         String    @db.VarChar(255)
  file_type         String    @db.VarChar(50)
  file_size         BigInt?   // bytes
  file_path         String    @db.VarChar(500)
  file_url          String?   @db.VarChar(500)
  uploaded_by       BigInt?
  uploaded_at       DateTime  @default(now()) @db.Timestamptz(6)
  
  course_syllabus   CourseSyllabus @relation(fields: [course_syllabus_id], references: [id], onDelete: Cascade)
  
  @@index([course_syllabus_id], map: "idx_syllabus_attachment_syllabus")
  @@index([week_number], map: "idx_syllabus_attachment_week")
  @@map("syllabus_attachments")
  @@schema("academic")
}
```

### 3.3. Indexes và Performance

#### 3.3.1. Indexes cho JSONB
```sql
-- Index cho tìm kiếm theo tuần
CREATE INDEX idx_syllabus_data_weeks ON academic.course_syllabus 
USING GIN ((syllabus_data->'weeks'));

-- Index cho tìm kiếm theo chủ đề (full-text search)
CREATE INDEX idx_syllabus_data_topic_fts ON academic.course_syllabus 
USING GIN (to_tsvector('vietnamese', syllabus_data::text));
```

#### 3.3.2. Materialized View cho báo cáo
```sql
CREATE MATERIALIZED VIEW academic.syllabus_summary AS
SELECT 
  cv.course_id,
  cv.version,
  cs.id as syllabus_id,
  cs.total_weeks,
  cs.total_hours,
  cs.has_exam_week,
  jsonb_array_length(cs.syllabus_data->'weeks') as week_count
FROM academic.course_versions cv
LEFT JOIN academic.course_syllabus cs ON cs.course_version_id = cv.id;

CREATE INDEX ON academic.syllabus_summary(course_id);
```

### 3.4. Migration Strategy

#### 3.4.1. Migration từ schema hiện tại
1. Thêm các cột metadata mới vào `course_syllabus`
2. Tính toán và điền giá trị từ `syllabus_data` JSONB hiện có
3. Tạo indexes mới
4. Tạo materialized views (nếu cần)

#### 3.4.2. Backward Compatibility
- Giữ nguyên cấu trúc JSONB hiện tại
- Chỉ thêm các trường mới, không xóa trường cũ
- Đảm bảo API vẫn hoạt động với dữ liệu cũ

## 4. API ENDPOINTS ĐỀ XUẤT

### 4.1. Quản lý đề cương
- `GET /api/tms/courses/:courseId/syllabus` - Lấy đề cương
- `POST /api/tms/courses/:courseId/syllabus` - Tạo đề cương mới
- `PUT /api/tms/courses/:courseId/syllabus/:syllabusId` - Cập nhật đề cương
- `DELETE /api/tms/courses/:courseId/syllabus/:syllabusId` - Xóa đề cương

### 4.2. Gợi ý đề cương
- `POST /api/tms/courses/:courseId/syllabus/suggest` - Tạo đề cương gợi ý
- `GET /api/tms/syllabus/templates` - Lấy danh sách template

### 4.3. Quản lý phiên bản
- `GET /api/tms/courses/:courseId/syllabus/versions` - Lấy danh sách phiên bản
- `GET /api/tms/courses/:courseId/syllabus/versions/:versionId` - Lấy chi tiết phiên bản
- `POST /api/tms/courses/:courseId/syllabus/versions/:versionId/restore` - Khôi phục phiên bản

### 4.4. Xuất đề cương
- `GET /api/tms/courses/:courseId/syllabus/export?format=pdf` - Xuất PDF
- `GET /api/tms/courses/:courseId/syllabus/export?format=word` - Xuất Word

## 5. VALIDATION RULES

### 5.1. Validation đề cương
- Số tuần: 1-20
- Mỗi tuần phải có: `week_number`, `topic`, `objectives`
- `week_number` phải unique trong một đề cương
- `duration_hours` phải > 0 nếu có
- Tổng `duration_hours` phải phù hợp với số tín chỉ

### 5.2. Validation file đính kèm
- Kích thước tối đa: 50MB
- Loại file cho phép: pdf, doc, docx, ppt, pptx, xls, xlsx, jpg, png
- Tên file không được chứa ký tự đặc biệt

## 6. SECURITY & PERMISSIONS

### 6.1. Quyền truy cập
- **Giảng viên**: CRUD đề cương của học phần mình phụ trách
- **Trưởng bộ môn**: Xem, duyệt tất cả đề cương trong bộ môn
- **Phòng đào tạo**: Xem, duyệt, xuất tất cả đề cương
- **Sinh viên**: Chỉ xem đề cương đã được duyệt

### 6.2. Audit Log
- Ghi log mọi thay đổi đề cương
- Lưu: người thay đổi, thời gian, nội dung thay đổi

## 7. FUTURE ENHANCEMENTS

1. **AI-Powered Suggestions**: Sử dụng AI để gợi ý đề cương thông minh hơn
2. **Collaborative Editing**: Nhiều người cùng chỉnh sửa đề cương
3. **Version Comparison**: So sánh trực quan giữa các phiên bản
4. **Analytics**: Thống kê về đề cương (số tuần trung bình, phân bổ thời gian, ...)
5. **Integration**: Tích hợp với hệ thống LMS để tự động tạo khóa học

