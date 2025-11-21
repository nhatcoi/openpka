# Use Cases: Xây dựng đề cương chi tiết môn học

## Danh sách Use Cases

1. [UC-1: Tạo đề cương mới](#uc-1-tạo-đề-cương-mới)
2. [UC-2: Chỉnh sửa đề cương](#uc-2-chỉnh-sửa-đề-cương)
3. [UC-3: Xem đề cương](#uc-3-xem-đề-cương)
4. [UC-4: Tạo phiên bản mới của đề cương](#uc-4-tạo-phiên-bản-mới-của-đề-cương)
5. [UC-5: Kích hoạt đề cương](#uc-5-kích-hoạt-đề-cương)
6. [UC-6: Upload tài liệu cho đề cương](#uc-6-upload-tài-liệu-cho-đề-cương)
7. [UC-7: Liên kết tài liệu với tuần học](#uc-7-liên-kết-tài-liệu-với-tuần-học)
8. [UC-8: Xóa đề cương](#uc-8-xóa-đề-cương)
9. [UC-9: Quản lý mục tiêu học tập (CLO)](#uc-9-quản-lý-mục-tiêu-học-tập-clo)
10. [UC-10: Quản lý kế hoạch đánh giá](#uc-10-quản-lý-kế-hoạch-đánh-giá)
11. [UC-11: Quản lý kế hoạch tuần](#uc-11-quản-lý-kế-hoạch-tuần)
12. [UC-12: Quản lý Rubrics](#uc-12-quản-lý-rubrics)

---

## UC-1: Tạo đề cương mới

### Mô tả
Giảng viên hoặc người có quyền tạo đề cương mới cho một Course Version.

### Actors
- Giảng viên (Lecturer)
- Quản trị viên môn học (Course Administrator)
- Người có quyền `tms.course.update`

### Preconditions
1. Người dùng đã đăng nhập vào hệ thống
2. Người dùng có quyền `tms.course.update`
3. Course Version đã tồn tại và đang ở trạng thái cho phép tạo đề cương

### Main Flow
1. Người dùng truy cập trang quản lý Course
2. Người dùng chọn một Course và Course Version
3. Người dùng nhấn nút "Xây dựng đề cương chi tiết" hoặc truy cập `/tms/courses/[id]/syllabus`
4. Hệ thống hiển thị trang xây dựng đề cương với các tab:
   - Thông tin cơ bản
   - Mục tiêu học tập
   - Kế hoạch tuần
   - Kế hoạch đánh giá
   - Phương pháp giảng dạy
   - Tài liệu
   - Quy định
   - Rubrics
5. Người dùng chọn Course Version từ dropdown (nếu có nhiều version)
6. Người dùng điền các thông tin trong các tab:
   - **Thông tin cơ bản**: Mô tả, mục tiêu, phân loại, điều kiện tiên quyết, số tuần, số giờ, phân bổ tín chỉ
   - **Mục tiêu học tập**: Thêm các CLO với mã, mô tả, và mapping PLO
   - **Kế hoạch tuần**: Thêm các tuần học với chủ đề, mục tiêu, phương pháp, tài liệu, bài tập
   - **Kế hoạch đánh giá**: Thêm các thành phần đánh giá với loại, trọng số (tổng = 100%)
   - **Phương pháp giảng dạy**: Mô tả chung và danh sách phương pháp cụ thể
   - **Quy định**: Quy định về điểm danh, nộp bài trễ, tính trung thực, thông tin liên hệ
   - **Rubrics**: Thêm các rubric với mã, tên, và tiêu chí chấm điểm (tổng trọng số = 100%)
7. Người dùng thiết lập metadata:
   - Trạng thái: draft/approved/archived (mặc định: draft)
   - Ngôn ngữ: vi/en/vi-en (mặc định: vi)
   - Ngày hiệu lực từ: (tùy chọn)
   - Ngày hiệu lực đến: (tùy chọn)
   - Đang sử dụng: yes/no (mặc định: no)
8. Người dùng nhấn nút "Lưu đề cương"
9. Hệ thống validate dữ liệu:
   - Kiểm tra Course Version tồn tại và thuộc về Course đúng
   - Kiểm tra tổng trọng số Assessment Plan = 100%
   - Kiểm tra tổng trọng số Rubrics = 100% cho mỗi rubric
10. Nếu validation thành công:
    - Hệ thống tạo đề cương mới với `version_no` tự động tăng
    - Nếu `is_current = true`, hệ thống đặt tất cả đề cương khác của cùng Course Version thành `is_current = false`
    - Hệ thống ghi nhận `created_by` và `updated_by`
    - Hệ thống lưu tất cả dữ liệu vào các trường JSONB
    - Hệ thống hiển thị thông báo "Lưu đề cương thành công!"
11. Nếu validation thất bại, hệ thống hiển thị thông báo lỗi

### Alternative Flows

#### A1: Course Version không tồn tại
- 3a. Nếu Course không có Version nào
  - Hệ thống hiển thị thông báo "Vui lòng tạo Course Version trước khi tạo đề cương"
  - Use case kết thúc

#### A2: Validation thất bại
- 9a. Nếu tổng trọng số Assessment Plan ≠ 100%
  - Hệ thống hiển thị cảnh báo "Tổng trọng số các thành phần đánh giá phải bằng 100%"
  - Người dùng có thể chỉnh sửa và lưu lại
- 9b. Nếu tổng trọng số Rubrics ≠ 100% cho bất kỳ rubric nào
  - Hệ thống hiển thị cảnh báo "Tổng trọng số các tiêu chí của rubric [tên] phải bằng 100%"
  - Người dùng có thể chỉnh sửa và lưu lại

#### A3: Người dùng hủy
- 8a. Người dùng nhấn nút "Quay lại"
  - Hệ thống quay về trang quản lý Course
  - Dữ liệu chưa lưu sẽ bị mất

### Postconditions
1. Đề cương mới được tạo thành công trong hệ thống
2. Đề cương có `version_no` tự động tăng
3. Nếu `is_current = true`, tất cả đề cương khác của cùng Course Version có `is_current = false`
4. Thông tin người tạo được ghi nhận trong `created_by` và `updated_by`

---

## UC-2: Chỉnh sửa đề cương

### Mô tả
Giảng viên hoặc người có quyền chỉnh sửa đề cương hiện có.

### Actors
- Giảng viên (Lecturer)
- Quản trị viên môn học (Course Administrator)
- Người có quyền `tms.course.update`

### Preconditions
1. Người dùng đã đăng nhập vào hệ thống
2. Người dùng có quyền `tms.course.update`
3. Đề cương đã tồn tại
4. Course Version đã tồn tại

### Main Flow
1. Người dùng truy cập trang quản lý Course
2. Người dùng chọn một Course và Course Version
3. Người dùng truy cập trang đề cương `/tms/courses/[id]/syllabus`
4. Hệ thống tự động tải đề cương hiện tại (nếu `is_current = true`) hoặc phiên bản mới nhất
5. Hệ thống hiển thị tất cả thông tin đề cương trong các tab tương ứng
6. Người dùng chỉnh sửa các thông tin trong các tab:
   - Có thể chỉnh sửa bất kỳ thành phần nào
   - Có thể thêm/sửa/xóa CLO
   - Có thể thêm/sửa/xóa tuần học
   - Có thể thêm/sửa/xóa thành phần đánh giá
   - Có thể thêm/sửa/xóa phương pháp giảng dạy
   - Có thể chỉnh sửa quy định
   - Có thể thêm/sửa/xóa rubrics
7. Người dùng có thể thay đổi metadata: trạng thái, ngôn ngữ, ngày hiệu lực, is_current
8. Người dùng nhấn nút "Lưu đề cương"
9. Hệ thống validate dữ liệu (tương tự UC-1)
10. Nếu validation thành công:
    - Hệ thống cập nhật đề cương hiện có
    - Nếu `is_current = true` được thay đổi, hệ thống đặt tất cả đề cương khác thành `is_current = false`
    - Hệ thống cập nhật `updated_by` và `updated_at`
    - Hệ thống lưu tất cả dữ liệu vào các trường JSONB
    - Hệ thống hiển thị thông báo "Lưu đề cương thành công!"

### Alternative Flows

#### A1: Đề cương không tồn tại
- 4a. Nếu không có đề cương nào cho Course Version này
  - Hệ thống hiển thị form trống
  - Use case chuyển sang UC-1 (Tạo đề cương mới)

#### A2: Validation thất bại
- Tương tự UC-1 A2

### Postconditions
1. Đề cương được cập nhật thành công
2. Thông tin người cập nhật được ghi nhận trong `updated_by` và `updated_at`

---

## UC-3: Xem đề cương

### Mô tả
Người dùng xem thông tin đề cương của một Course Version.

### Actors
- Tất cả người dùng đã đăng nhập có quyền `tms.course.view`
- Giảng viên
- Sinh viên (nếu có quyền xem)
- Quản trị viên

### Preconditions
1. Người dùng đã đăng nhập vào hệ thống
2. Người dùng có quyền `tms.course.view`
3. Course và Course Version đã tồn tại

### Main Flow
1. Người dùng truy cập trang quản lý Course
2. Người dùng chọn một Course
3. Người dùng truy cập trang đề cương `/tms/courses/[id]/syllabus`
4. Hệ thống tự động tải đề cương hiện tại (nếu `is_current = true`) hoặc phiên bản mới nhất
5. Hệ thống hiển thị tất cả thông tin đề cương trong các tab:
   - Thông tin cơ bản
   - Mục tiêu học tập (danh sách CLO)
   - Kế hoạch tuần (danh sách các tuần)
   - Kế hoạch đánh giá (danh sách thành phần đánh giá với trọng số)
   - Phương pháp giảng dạy
   - Tài liệu (danh sách tài liệu có thể tải xuống)
   - Quy định
   - Rubrics (danh sách rubric với tiêu chí)
6. Người dùng có thể chuyển đổi giữa các tab để xem từng phần
7. Người dùng có thể chọn Course Version khác từ dropdown để xem đề cương của version đó

### Alternative Flows

#### A1: Không có đề cương
- 4a. Nếu không có đề cương nào cho Course Version này
  - Hệ thống hiển thị thông báo "Chưa có đề cương cho Course Version này"
  - Nếu người dùng có quyền `tms.course.update`, hiển thị nút "Tạo đề cương mới"

#### A2: Chọn version khác
- 7a. Người dùng chọn Course Version khác từ dropdown
  - Hệ thống tải đề cương của version đã chọn
  - Quay lại bước 5

### Postconditions
1. Người dùng đã xem được thông tin đề cương
2. Không có thay đổi nào trong hệ thống

---

## UC-4: Tạo phiên bản mới của đề cương

### Mô tả
Người dùng tạo một phiên bản mới của đề cương dựa trên phiên bản cũ, để có thể chỉnh sửa mà không ảnh hưởng đến phiên bản hiện tại.

### Actors
- Giảng viên (Lecturer)
- Quản trị viên môn học (Course Administrator)
- Người có quyền `tms.course.update`

### Preconditions
1. Người dùng đã đăng nhập vào hệ thống
2. Người dùng có quyền `tms.course.update`
3. Đã có ít nhất một đề cương cho Course Version

### Main Flow
1. Người dùng truy cập trang đề cương `/tms/courses/[id]/syllabus`
2. Hệ thống hiển thị đề cương hiện tại
3. Người dùng chỉnh sửa các thông tin cần thiết
4. Người dùng nhấn nút "Lưu đề cương"
5. Hệ thống kiểm tra:
   - Nếu có thay đổi đáng kể hoặc người dùng muốn tạo phiên bản mới
6. Hệ thống tạo đề cương mới với:
   - `version_no` tự động tăng (version_no mới = version_no cũ + 1)
   - Copy toàn bộ dữ liệu từ đề cương cũ
   - Áp dụng các thay đổi người dùng đã chỉnh sửa
   - Giữ nguyên `is_current` (hoặc có thể đặt thành false nếu muốn)
7. Hệ thống hiển thị thông báo "Tạo phiên bản mới thành công!"

### Alternative Flows

#### A1: Cập nhật đề cương hiện tại thay vì tạo mới
- 5a. Người dùng chỉnh sửa đề cương hiện tại mà không muốn tạo phiên bản mới
  - Hệ thống cập nhật đề cương hiện có (UC-2)
  - Use case kết thúc

### Postconditions
1. Đề cương phiên bản mới được tạo thành công
2. Đề cương cũ vẫn tồn tại trong hệ thống
3. Có thể có nhiều phiên bản đề cương cho cùng một Course Version

---

## UC-5: Kích hoạt đề cương

### Mô tả
Người dùng đặt một đề cương là đề cương đang sử dụng hiện tại.

### Actors
- Giảng viên (Lecturer)
- Quản trị viên môn học (Course Administrator)
- Người có quyền `tms.course.update`

### Preconditions
1. Người dùng đã đăng nhập vào hệ thống
2. Người dùng có quyền `tms.course.update`
3. Đề cương đã tồn tại

### Main Flow
1. Người dùng truy cập trang đề cương `/tms/courses/[id]/syllabus`
2. Hệ thống hiển thị đề cương
3. Người dùng thay đổi trường "Đang sử dụng" từ "Không" sang "Có"
4. Người dùng nhấn nút "Lưu đề cương"
5. Hệ thống kiểm tra và cập nhật:
   - Đặt đề cương hiện tại có `is_current = true`
   - Đặt tất cả đề cương khác của cùng Course Version có `is_current = false`
6. Hệ thống hiển thị thông báo "Kích hoạt đề cương thành công!"

### Alternative Flows

#### A1: Hủy kích hoạt
- 3a. Người dùng thay đổi "Đang sử dụng" từ "Có" sang "Không"
  - Hệ thống đặt `is_current = false` cho đề cương này
  - Không có đề cương nào khác được tự động kích hoạt

### Postconditions
1. Chỉ có một đề cương của Course Version có `is_current = true`
2. Tất cả đề cương khác có `is_current = false`

---

## UC-6: Upload tài liệu cho đề cương

### Mô tả
Người dùng upload tài liệu (file) để sử dụng trong đề cương.

### Actors
- Giảng viên (Lecturer)
- Quản trị viên môn học (Course Administrator)
- Người có quyền `tms.course.update`

### Preconditions
1. Người dùng đã đăng nhập vào hệ thống
2. Người dùng có quyền `tms.course.update`
3. Đề cương đã được tạo (có `syllabus_id` hoặc `course_version_id`)

### Main Flow
1. Người dùng truy cập trang đề cương `/tms/courses/[id]/syllabus`
2. Người dùng chuyển sang tab "Tài liệu"
3. Người dùng nhấn nút "Upload tài liệu"
4. Hệ thống hiển thị dialog upload
5. Người dùng chọn file từ máy tính (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, JPEG, PNG, GIF)
6. Người dùng chọn loại tài liệu: syllabus, textbook, reference, assignment, exam, other
7. Người dùng nhập mô tả (tùy chọn)
8. Người dùng nhấn nút "Upload"
9. Hệ thống validate file:
   - Kiểm tra kích thước file (tối đa 10MB)
   - Kiểm tra định dạng file
10. Hệ thống upload file lên storage (Cloudinary hoặc tương tự)
11. Hệ thống tạo bản ghi Document với:
    - `entity_type = 'course_syllabus'`
    - `entity_id = syllabus_id` hoặc `course_version_id`
    - `document_type` = loại tài liệu đã chọn
    - `file_name`, `original_name`, `file_url`, `file_size`, `mime_type`
    - `description` (nếu có)
    - `is_active = true`
12. Hệ thống hiển thị thông báo "Upload tài liệu thành công!"
13. Hệ thống làm mới danh sách tài liệu

### Alternative Flows

#### A1: Đề cương chưa được lưu
- 3a. Nếu đề cương chưa được lưu (chưa có `syllabus_id`)
  - Hệ thống hiển thị thông báo "Vui lòng lưu đề cương trước khi upload tài liệu"
  - Use case kết thúc

#### A2: File không hợp lệ
- 9a. Nếu kích thước file > 10MB
  - Hệ thống hiển thị thông báo "File size too large. Maximum size is 10MB."
  - Người dùng có thể chọn file khác
- 9b. Nếu định dạng file không được hỗ trợ
  - Hệ thống hiển thị thông báo "Định dạng file không được hỗ trợ"
  - Người dùng có thể chọn file khác

#### A3: Upload thất bại
- 10a. Nếu upload lên storage thất bại
  - Hệ thống hiển thị thông báo "Lỗi khi upload file. Vui lòng thử lại."
  - Use case kết thúc

### Postconditions
1. File được upload thành công lên storage
2. Bản ghi Document được tạo trong database
3. Tài liệu xuất hiện trong danh sách tài liệu của đề cương

---

## UC-7: Liên kết tài liệu với tuần học

### Mô tả
Người dùng liên kết tài liệu đã upload với các tuần học trong Weekly Plan.

### Actors
- Giảng viên (Lecturer)
- Quản trị viên môn học (Course Administrator)
- Người có quyền `tms.course.update`

### Preconditions
1. Người dùng đã đăng nhập vào hệ thống
2. Người dùng có quyền `tms.course.update`
3. Đề cương đã được lưu (có `syllabus_id`)
4. Đã có ít nhất một tài liệu đã upload
5. Đã có ít nhất một tuần học trong Weekly Plan

### Main Flow
1. Người dùng truy cập trang đề cương `/tms/courses/[id]/syllabus`
2. Người dùng chuyển sang tab "Kế hoạch tuần"
3. Người dùng nhấn nút "Sửa" cho một tuần học
4. Hệ thống hiển thị dialog chỉnh sửa tuần
5. Trong dialog, có phần "Tài liệu học tập từ Materials"
6. Người dùng chọn một hoặc nhiều tài liệu từ danh sách autocomplete
7. Hệ thống hiển thị các tài liệu đã chọn dưới dạng chips
8. Người dùng có thể gỡ bỏ tài liệu bằng cách click vào chip
9. Người dùng nhấn nút "Lưu" trong dialog
10. Hệ thống cập nhật tuần học với `materials_documents` = danh sách ID tài liệu đã chọn
11. Người dùng nhấn nút "Lưu đề cương" ở trang chính
12. Hệ thống lưu toàn bộ Weekly Plan (bao gồm thông tin liên kết tài liệu)

### Alternative Flows

#### A1: Chưa có tài liệu
- 6a. Nếu chưa có tài liệu nào đã upload
  - Autocomplete hiển thị thông báo "Chưa có tài liệu nào. Vui lòng upload tài liệu trước."
  - Người dùng có thể chuyển sang tab Materials để upload

#### A2: Chưa lưu đề cương
- 5a. Nếu đề cương chưa được lưu
  - Autocomplete bị disable
  - Hiển thị thông báo "Vui lòng lưu đề cương trước để có thể chọn tài liệu từ Materials."

### Postconditions
1. Tuần học đã được liên kết với các tài liệu đã chọn
2. Trong Weekly Plan, tuần học hiển thị danh sách tài liệu đã liên kết
3. Có thể click vào tài liệu để tải xuống

---

## UC-8: Xóa đề cương

### Mô tả
Người dùng xóa một đề cương khỏi hệ thống.

### Actors
- Quản trị viên môn học (Course Administrator)
- Người có quyền `tms.course.delete`

### Preconditions
1. Người dùng đã đăng nhập vào hệ thống
2. Người dùng có quyền `tms.course.delete`
3. Đề cương đã tồn tại

### Main Flow
1. Người dùng truy cập API endpoint DELETE `/api/tms/courses/[id]/syllabus`
2. Người dùng gửi request với `syllabus_id`
3. Hệ thống kiểm tra quyền truy cập
4. Hệ thống xác minh đề cương tồn tại và thuộc về Course đúng
5. Hệ thống xóa đề cương khỏi database
6. Hệ thống trả về thông báo "Syllabus deleted successfully"

### Alternative Flows

#### A1: Không có quyền
- 3a. Nếu người dùng không có quyền `tms.course.delete`
  - Hệ thống trả về lỗi 403 Forbidden
  - Use case kết thúc

#### A2: Đề cương không tồn tại
- 4a. Nếu đề cương không tồn tại
  - Hệ thống trả về lỗi "Syllabus not found"
  - Use case kết thúc

#### A3: Đề cương không thuộc về Course
- 4b. Nếu đề cương không thuộc về Course đúng
  - Hệ thống trả về lỗi "Syllabus does not belong to this course"
  - Use case kết thúc

### Postconditions
1. Đề cương đã bị xóa khỏi hệ thống
2. Tất cả dữ liệu liên quan đến đề cương đã bị xóa

---

## UC-9: Quản lý mục tiêu học tập (CLO)

### Mô tả
Người dùng thêm, sửa, xóa các Course Learning Outcomes (CLO) trong đề cương.

### Actors
- Giảng viên (Lecturer)
- Quản trị viên môn học (Course Administrator)
- Người có quyền `tms.course.update`

### Preconditions
1. Người dùng đã đăng nhập vào hệ thống
2. Người dùng có quyền `tms.course.update`
3. Đã truy cập trang đề cương

### Main Flow

#### 9.1. Thêm CLO mới
1. Người dùng chuyển sang tab "Mục tiêu học tập"
2. Người dùng nhấn nút "Thêm CLO"
3. Hệ thống hiển thị dialog thêm CLO
4. Người dùng nhập:
   - Mã CLO (VD: CLO1, CLO2...)
   - Mô tả mục tiêu học tập
   - Mapping với PLO (tùy chọn): Danh sách mã PLO
5. Người dùng nhấn nút "Lưu"
6. Hệ thống validate:
   - Mã CLO không được rỗng
   - Mô tả không được rỗng
7. Hệ thống thêm CLO vào danh sách
8. Dialog đóng lại

#### 9.2. Sửa CLO
1. Người dùng nhấn nút "Sửa" trên một CLO
2. Hệ thống hiển thị dialog với thông tin CLO hiện tại
3. Người dùng chỉnh sửa thông tin
4. Người dùng nhấn nút "Lưu"
5. Hệ thống cập nhật CLO

#### 9.3. Xóa CLO
1. Người dùng nhấn nút "Xóa" trên một CLO
2. Hệ thống xóa CLO khỏi danh sách

### Alternative Flows

#### A1: Validation thất bại
- 6a. Nếu mã CLO hoặc mô tả rỗng
  - Hệ thống disable nút "Lưu"
  - Hiển thị cảnh báo validation

### Postconditions
1. Danh sách CLO đã được cập nhật
2. Thay đổi chưa được lưu vào database cho đến khi nhấn "Lưu đề cương"

---

## UC-10: Quản lý kế hoạch đánh giá

### Mô tả
Người dùng thêm, sửa, xóa các thành phần đánh giá và đảm bảo tổng trọng số = 100%.

### Actors
- Giảng viên (Lecturer)
- Quản trị viên môn học (Course Administrator)
- Người có quyền `tms.course.update`

### Preconditions
1. Người dùng đã đăng nhập vào hệ thống
2. Người dùng có quyền `tms.course.update`
3. Đã truy cập trang đề cương

### Main Flow

#### 10.1. Thêm thành phần đánh giá
1. Người dùng chuyển sang tab "Kế hoạch đánh giá"
2. Người dùng nhấn nút "Thêm thành phần"
3. Hệ thống hiển thị dialog
4. Người dùng nhập:
   - Tên thành phần (VD: Bài tập về nhà, Kiểm tra giữa kỳ...)
   - Loại đánh giá: assignment, quiz, midterm, final, project, presentation, participation, other
   - Trọng số (%): 0-100
   - Mô tả (tùy chọn)
   - Tiêu chí đánh giá (tùy chọn)
5. Người dùng nhấn nút "Lưu"
6. Hệ thống validate:
   - Tên không được rỗng
   - Loại đánh giá phải được chọn
   - Trọng số phải ≥ 0 và ≤ 100
7. Hệ thống thêm thành phần vào danh sách
8. Hệ thống hiển thị tổng trọng số hiện tại
9. Nếu tổng trọng số ≠ 100%, hiển thị cảnh báo "Cần đạt 100%"

### Alternative Flows

#### A1: Tổng trọng số không bằng 100%
- 8a. Nếu tổng trọng số < 100%
  - Hiển thị cảnh báo màu vàng "Tổng trọng số: X% (Cần đạt 100%)"
- 8b. Nếu tổng trọng số > 100%
  - Hiển thị cảnh báo màu đỏ "Tổng trọng số: X% (Vượt quá 100%)"

### Postconditions
1. Danh sách thành phần đánh giá đã được cập nhật
2. Tổng trọng số được tính toán và hiển thị

---

## UC-11: Quản lý kế hoạch tuần

### Mô tả
Người dùng thêm, sửa, xóa các tuần học trong Weekly Plan.

### Actors
- Giảng viên (Lecturer)
- Quản trị viên môn học (Course Administrator)
- Người có quyền `tms.course.update`

### Preconditions
1. Người dùng đã đăng nhập vào hệ thống
2. Người dùng có quyền `tms.course.update`
3. Đã truy cập trang đề cương

### Main Flow

#### 11.1. Thêm tuần học
1. Người dùng chuyển sang tab "Kế hoạch tuần"
2. Người dùng nhấn nút "Thêm tuần"
3. Hệ thống hiển thị dialog
4. Người dùng nhập:
   - Số tuần: Tự động tăng từ tuần cuối cùng + 1
   - Chủ đề tuần (bắt buộc)
   - Mục tiêu tuần
   - Phương pháp giảng dạy
   - Tài liệu học tập: Chọn từ Materials (nếu có)
   - Tài liệu học tập (mô tả thêm): Text mô tả
   - Bài tập/Nhiệm vụ
   - Thời lượng (giờ): Mặc định 3
   - Checkbox "Tuần thi"
   - Checkbox "Tuần giữa kỳ"
   - Ghi chú
5. Người dùng nhấn nút "Lưu"
6. Hệ thống validate:
   - Số tuần phải ≥ 1
   - Chủ đề tuần không được rỗng
   - Thời lượng phải ≥ 0
7. Hệ thống thêm tuần vào danh sách (sắp xếp theo số tuần)

#### 11.2. Sửa tuần học
1. Người dùng nhấn nút "Sửa" trên một tuần
2. Hệ thống hiển thị dialog với thông tin tuần hiện tại
3. Người dùng chỉnh sửa thông tin
4. Người dùng nhấn nút "Lưu"
5. Hệ thống cập nhật tuần

#### 11.3. Xóa tuần học
1. Người dùng nhấn nút "Xóa" trên một tuần
2. Hệ thống xóa tuần khỏi danh sách
3. Hệ thống tự động sắp xếp lại số tuần (1, 2, 3...)

### Alternative Flows

#### A1: Chưa có tài liệu để chọn
- 4a. Nếu chưa upload tài liệu
  - Autocomplete hiển thị thông báo "Vui lòng lưu đề cương trước để có thể chọn tài liệu từ Materials."

### Postconditions
1. Danh sách tuần học đã được cập nhật
2. Các tuần được sắp xếp theo số tuần tăng dần

---

## UC-12: Quản lý Rubrics

### Mô tả
Người dùng thêm, sửa, xóa rubrics và tiêu chí chấm điểm, đảm bảo tổng trọng số các tiêu chí trong mỗi rubric = 100%.

### Actors
- Giảng viên (Lecturer)
- Quản trị viên môn học (Course Administrator)
- Người có quyền `tms.course.update`

### Preconditions
1. Người dùng đã đăng nhập vào hệ thống
2. Người dùng có quyền `tms.course.update`
3. Đã truy cập trang đề cương

### Main Flow

#### 12.1. Thêm Rubric mới
1. Người dùng chuyển sang tab "Rubrics"
2. Người dùng nhấn nút "Thêm rubric"
3. Hệ thống hiển thị dialog
4. Người dùng nhập:
   - Mã rubric (VD: PRJ, ASS, QUIZ...)
   - Tên rubric (VD: Project cuối kỳ, Bài tập lớn...)
5. Người dùng nhấn nút "Lưu"
6. Hệ thống validate:
   - Mã rubric không được rỗng
   - Tên rubric không được rỗng
7. Hệ thống tạo rubric mới (chưa có tiêu chí nào)

#### 12.2. Thêm tiêu chí vào Rubric
1. Người dùng mở rubric (accordion expanded)
2. Người dùng nhấn nút "Thêm tiêu chí"
3. Hệ thống hiển thị dialog
4. Người dùng nhập:
   - Tên tiêu chí
   - Trọng số (%): 0-100
5. Người dùng nhấn nút "Lưu"
6. Hệ thống validate:
   - Tên tiêu chí không được rỗng
   - Trọng số phải ≥ 0 và ≤ 100
7. Hệ thống thêm tiêu chí vào rubric
8. Hệ thống tính tổng trọng số và hiển thị
9. Nếu tổng trọng số ≠ 100%, hiển thị cảnh báo

#### 12.3. Sửa Rubric/Tiêu chí
1. Người dùng nhấn nút "Sửa" trên rubric hoặc tiêu chí
2. Hệ thống hiển thị dialog với thông tin hiện tại
3. Người dùng chỉnh sửa
4. Người dùng nhấn nút "Lưu"
5. Hệ thống cập nhật

#### 12.4. Xóa Rubric/Tiêu chí
1. Người dùng nhấn nút "Xóa" trên rubric hoặc tiêu chí
2. Hệ thống xóa khỏi danh sách

### Alternative Flows

#### A1: Tổng trọng số không bằng 100%
- 8a. Tương tự UC-10 A1

### Postconditions
1. Danh sách rubrics đã được cập nhật
2. Mỗi rubric hiển thị tổng trọng số các tiêu chí

---

## Tóm tắt Actors và Quyền

| Actor | Quyền cần thiết | Use Cases |
|-------|----------------|-----------|
| Giảng viên | `tms.course.view`, `tms.course.update` | UC-1, UC-2, UC-3, UC-4, UC-5, UC-6, UC-7, UC-9, UC-10, UC-11, UC-12 |
| Quản trị viên | `tms.course.view`, `tms.course.update`, `tms.course.delete` | Tất cả UC |
| Sinh viên | `tms.course.view` | UC-3 |

