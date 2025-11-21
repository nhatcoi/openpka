# API Specification - Đề cương Chi tiết Học phần

## 1. API ENDPOINTS

### 1.1. Quản lý Đề cương

#### GET /api/tms/courses/:courseId/syllabus
Lấy đề cương của học phần

**Parameters:**
- `courseId` (path, required): ID học phần
- `version` (query, optional): Phiên bản đề cương (mặc định: latest)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "course_version_id": "456",
    "total_weeks": 12,
    "total_hours": 45.0,
    "has_exam_week": true,
    "exam_week_number": 12,
    "syllabus_data": {
      "version": "1.0",
      "weeks": [
        {
          "week_number": 1,
          "topic": "Giới thiệu về lập trình",
          "objectives": "- Hiểu khái niệm lập trình\n- Nắm môi trường phát triển",
          "teaching_methods": "Lý thuyết + Thực hành",
          "materials": "- Slide bài giảng\n- Tài liệu tham khảo",
          "assignments": "Bài tập nhỏ về cú pháp cơ bản",
          "duration_hours": 3,
          "is_exam_week": false,
          "attachments": []
        }
      ],
      "metadata": {
        "created_by_template": "programming_template",
        "auto_generated": true,
        "generation_date": "2024-01-15T10:00:00Z"
      }
    },
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

#### POST /api/tms/courses/:courseId/syllabus
Tạo đề cương mới

**Request Body:**
```json
{
  "course_version_id": "456",
  "total_weeks": 12,
  "total_hours": 45.0,
  "has_exam_week": true,
  "exam_week_number": 12,
  "syllabus_data": {
    "version": "1.0",
    "weeks": [
      {
        "week_number": 1,
        "topic": "Giới thiệu về lập trình",
        "objectives": "- Hiểu khái niệm lập trình",
        "materials": "- Slide bài giảng",
        "assignments": "Bài tập nhỏ",
        "duration_hours": 3
      }
    ]
  }
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "message": "Đề cương đã được tạo thành công"
  }
}
```

#### PUT /api/tms/courses/:courseId/syllabus/:syllabusId
Cập nhật đề cương

**Request Body:** (tương tự POST)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "message": "Đề cương đã được cập nhật"
  }
}
```

#### DELETE /api/tms/courses/:courseId/syllabus/:syllabusId
Xóa đề cương

**Response 200:**
```json
{
  "success": true,
  "message": "Đề cương đã được xóa"
}
```

---

### 1.2. Gợi ý Đề cương

#### POST /api/tms/courses/:courseId/syllabus/suggest
Tạo đề cương gợi ý tự động

**Request Body:**
```json
{
  "number_of_weeks": 12,
  "options": {
    "include_exam_week": true,
    "include_midterm": false,
    "template_preference": "auto" // "auto" | "programming" | "database" | ...
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "suggested_syllabus": {
      "total_weeks": 12,
      "total_hours": 45.0,
      "has_exam_week": true,
      "exam_week_number": 12,
      "syllabus_data": {
        "version": "1.0",
        "weeks": [...]
      },
      "template_used": "programming_template",
      "is_auto_generated": true,
      "generation_metadata": {
        "course_type_detected": "programming",
        "keywords_found": ["lập trình", "programming"],
        "confidence_score": 0.85
      }
    },
    "preview": true
  }
}
```

#### GET /api/tms/syllabus/templates
Lấy danh sách template đề cương

**Query Parameters:**
- `course_type` (optional): Lọc theo loại môn học
- `active_only` (optional, default: true): Chỉ lấy template đang active

**Response 200:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "1",
        "name": "Template Lập trình",
        "description": "Template cho môn lập trình",
        "course_type": "programming",
        "keywords": ["lập trình", "programming", "coding"],
        "default_weeks": 12,
        "usage_count": 45,
        "is_active": true
      }
    ]
  }
}
```

---

### 1.3. Quản lý Phiên bản

#### GET /api/tms/courses/:courseId/syllabus/versions
Lấy danh sách phiên bản đề cương

**Response 200:**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "123",
        "course_version_id": "456",
        "version": "1.0",
        "total_weeks": 12,
        "created_at": "2024-01-15T10:00:00Z",
        "created_by": {
          "id": "789",
          "name": "Nguyễn Văn A"
        },
        "is_current": true
      }
    ]
  }
}
```

#### GET /api/tms/courses/:courseId/syllabus/versions/:versionId
Lấy chi tiết phiên bản

**Response 200:** (tương tự GET syllabus)

#### POST /api/tms/courses/:courseId/syllabus/versions/:versionId/restore
Khôi phục phiên bản cũ

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Đã khôi phục phiên bản",
    "syllabus_id": "123"
  }
}
```

---

### 1.4. Quản lý File Đính kèm

#### POST /api/tms/courses/:courseId/syllabus/:syllabusId/attachments
Tải lên file đính kèm

**Request:** multipart/form-data
- `file` (required): File cần tải lên
- `week_number` (optional): Tuần nào (null nếu là file chung)

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "att_123",
    "file_name": "slide_tuan_1.pdf",
    "file_type": "pdf",
    "file_size": 1024000,
    "file_url": "/api/files/att_123",
    "uploaded_at": "2024-01-15T10:00:00Z"
  }
}
```

#### DELETE /api/tms/courses/:courseId/syllabus/:syllabusId/attachments/:attachmentId
Xóa file đính kèm

**Response 200:**
```json
{
  "success": true,
  "message": "File đã được xóa"
}
```

---

### 1.5. Xuất Đề cương

#### GET /api/tms/courses/:courseId/syllabus/export
Xuất đề cương ra file

**Query Parameters:**
- `format` (required): "pdf" | "word" | "excel"
- `include_attachments` (optional, default: false): Bao gồm file đính kèm
- `version` (optional): Phiên bản đề cương

**Response 200:**
- Content-Type: application/pdf hoặc application/vnd.openxmlformats-officedocument...
- File download

---

## 2. ERROR RESPONSES

### 2.1. Validation Errors (400)
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    {
      "field": "total_weeks",
      "message": "Số tuần phải từ 1 đến 20"
    }
  ]
}
```

### 2.2. Not Found (404)
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Không tìm thấy đề cương"
}
```

### 2.3. Permission Denied (403)
```json
{
  "success": false,
  "error": "PERMISSION_DENIED",
  "message": "Bạn không có quyền thực hiện thao tác này"
}
```

### 2.4. Server Error (500)
```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "Đã xảy ra lỗi hệ thống"
}
```

---

## 3. DATA FLOW

### 3.1. Tạo Đề cương Thủ công

```
[Frontend] 
  → POST /api/tms/courses/:id/syllabus
  → [Backend API]
    → Validate input
    → Calculate metadata (total_weeks, total_hours, ...)
    → Save to database
    → Return response
  ← [Frontend]
```

### 3.2. Gợi ý Đề cương Tự động

```
[Frontend]
  → POST /api/tms/courses/:id/syllabus/suggest
  → [Backend API]
    → Get course info
    → Analyze course (name, type, credits, objectives)
    → Detect course type from keywords
    → Load template (if exists)
    → Generate syllabus structure
    → Calculate week distribution
    → Generate topics, objectives, materials, assignments
    → Return suggested syllabus
  ← [Frontend]
    → User reviews and edits
    → POST /api/tms/courses/:id/syllabus (to save)
```

### 3.3. Quản lý Phiên bản

```
[Frontend]
  → GET /api/tms/courses/:id/syllabus/versions
  → [Backend API]
    → Query CourseVersion with CourseSyllabus
    → Return list of versions
  ← [Frontend]
    → User selects version
    → GET /api/tms/courses/:id/syllabus/versions/:versionId
    → Display version details
```

---

## 4. VALIDATION RULES

### 4.1. Syllabus Data
- `total_weeks`: 1-20, required
- `total_hours`: > 0, optional
- `syllabus_data.weeks`: Array, required, min 1 item
- `syllabus_data.weeks[].week_number`: 1-20, required, unique in array
- `syllabus_data.weeks[].topic`: String, required, max 500 chars
- `syllabus_data.weeks[].objectives`: String, required
- `syllabus_data.weeks[].duration_hours`: Number, > 0, optional

### 4.2. File Attachments
- File size: Max 50MB
- File types: pdf, doc, docx, ppt, pptx, xls, xlsx, jpg, png
- File name: Max 255 chars, no special characters

---

## 5. PERFORMANCE CONSIDERATIONS

### 5.1. Caching
- Cache template data (TTL: 1 hour)
- Cache syllabus data (TTL: 5 minutes)

### 5.2. Pagination
- List endpoints support pagination:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 100)

### 5.3. Optimization
- Use indexes on frequently queried fields
- Use JSONB indexes for full-text search
- Lazy load attachments

---

## 6. SECURITY

### 6.1. Authentication
- All endpoints require authentication
- JWT token in Authorization header

### 6.2. Authorization
- Check user permissions before operations
- Role-based access control (RBAC)

### 6.3. File Upload Security
- Validate file type and size
- Scan for malware (if possible)
- Store files outside web root
- Generate secure file URLs

---

## 7. TESTING

### 7.1. Unit Tests
- Validation logic
- Template matching
- Syllabus generation

### 7.2. Integration Tests
- API endpoints
- Database operations
- File upload/download

### 7.3. E2E Tests
- Complete user flows
- Permission checks
- Error handling

