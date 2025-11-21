# Nghiệp vụ: Xây dựng đề cương chi tiết môn học

## 1. Tổng quan

Đề cương chi tiết môn học (Course Syllabus) là tài liệu mô tả đầy đủ về một môn học, bao gồm mục tiêu học tập, kế hoạch giảng dạy, phương pháp đánh giá, tài liệu học tập và các quy định liên quan.

## 2. Quy tắc nghiệp vụ

### 2.1. Liên kết với Course Version
- Mỗi đề cương phải gắn với một **Course Version** cụ thể
- Không thể tạo đề cương nếu chưa có Course Version
- Một Course Version có thể có nhiều phiên bản đề cương (version_no)
- Một Course Version chỉ có một đề cương được đánh dấu `is_current = true` tại một thời điểm

### 2.2. Phiên bản đề cương (Versioning)
- Mỗi đề cương có số phiên bản (`version_no`), bắt đầu từ 1
- Khi tạo đề cương mới, nếu không chỉ định `version_no`, hệ thống tự động tăng số phiên bản tiếp theo
- Cho phép tạo nhiều phiên bản đề cương cho cùng một Course Version
- Mỗi phiên bản đề cương là độc lập và có thể chỉnh sửa riêng

### 2.3. Trạng thái đề cương
- **draft**: Đề cương đang được soạn thảo, có thể chỉnh sửa tự do
- **approved**: Đề cương đã được phê duyệt, không nên chỉnh sửa trực tiếp (nên tạo phiên bản mới)
- **archived**: Đề cương đã được lưu trữ, không còn sử dụng

### 2.4. Ngôn ngữ
- Hỗ trợ 3 loại ngôn ngữ: `vi` (Tiếng Việt), `en` (English), `vi-en` (Song ngữ)
- Mỗi đề cương có thể có phiên bản riêng cho từng ngôn ngữ

### 2.5. Hiệu lực
- `effective_from`: Ngày bắt đầu hiệu lực của đề cương
- `effective_to`: Ngày kết thúc hiệu lực (có thể null nếu không có thời hạn)
- `is_current`: Đánh dấu đề cương đang được sử dụng hiện tại
  - Khi đặt một đề cương là `is_current = true`, tất cả đề cương khác của cùng Course Version sẽ được đặt `is_current = false`

### 2.6. Quyền truy cập
- **Xem đề cương**: Yêu cầu quyền `tms.course.view`
- **Tạo/Cập nhật đề cương**: Yêu cầu quyền `tms.course.update`
- **Xóa đề cương**: Yêu cầu quyền `tms.course.delete`

### 2.7. Thông tin người thực hiện
- Mỗi đề cương lưu `created_by` và `updated_by` để theo dõi lịch sử
- Hệ thống tự động ghi nhận người tạo và người cập nhật cuối cùng

## 3. Cấu trúc đề cương

### 3.1. Thông tin cơ bản (basic_info)
- **Mô tả môn học**: Tổng quan về môn học, nội dung chính
- **Mục tiêu học tập**: Mục tiêu tổng thể của môn học
- **Phân loại môn học**: Bắt buộc, Tự chọn, Cơ sở, Chuyên ngành...
- **Loại môn học**: Lý thuyết, Thực hành, Hỗn hợp...
- **Điều kiện tiên quyết**: Các môn học hoặc kiến thức cần có trước
- **Tổng số tuần**: Số tuần học dự kiến (1-20)
- **Tổng số giờ**: Tổng số giờ học (số thực, hỗ trợ 0.5)
- **Phân bổ tín chỉ**: Mô tả phân bổ tín chỉ (VD: "3 LT + 1 TH")

### 3.2. Mục tiêu học tập (learning_outcomes)
- Danh sách các Course Learning Outcomes (CLO)
- Mỗi CLO gồm:
  - **Mã CLO**: VD: CLO1, CLO2...
  - **Mô tả**: Mô tả chi tiết mục tiêu học tập
  - **PLO Mapping**: Danh sách các Program Learning Outcomes (PLO) mà CLO này đóng góp vào

### 3.3. Kế hoạch tuần (weekly_plan)
- Danh sách các tuần học
- Mỗi tuần gồm:
  - **Số tuần**: Thứ tự tuần học
  - **Chủ đề tuần**: Nội dung/chủ đề chính của tuần
  - **Mục tiêu tuần**: Mục tiêu học tập cụ thể cho tuần
  - **Phương pháp giảng dạy**: Phương pháp sẽ sử dụng trong tuần
  - **Tài liệu học tập**:
    - Danh sách tài liệu từ Materials (liên kết đến Documents)
    - Mô tả thêm về tài liệu (text)
  - **Bài tập/Nhiệm vụ**: Bài tập, project cho tuần
  - **Thời lượng**: Số giờ học của tuần (mặc định 3 giờ)
  - **Tuần thi**: Đánh dấu nếu là tuần thi cuối kỳ
  - **Tuần giữa kỳ**: Đánh dấu nếu là tuần thi giữa kỳ
  - **Ghi chú**: Ghi chú bổ sung

### 3.4. Kế hoạch đánh giá (assessment_plan)
- Danh sách các thành phần đánh giá
- Mỗi thành phần gồm:
  - **Tên**: Tên thành phần đánh giá
  - **Loại**: assignment, quiz, midterm, final, project, presentation, participation, other
  - **Trọng số (%)**: Phần trăm điểm của thành phần này (0-100)
  - **Mô tả**: Mô tả chi tiết về thành phần đánh giá
  - **Tiêu chí**: Tiêu chí cụ thể để đánh giá
- **Tổng trọng số**: Tổng trọng số của tất cả thành phần phải bằng 100%

### 3.5. Phương pháp giảng dạy (teaching_methods)
- **Mô tả chung**: Mô tả tổng quan về phương pháp giảng dạy
- **Danh sách phương pháp**: 
  - Mỗi phương pháp gồm:
    - **Tên phương pháp**: VD: Thuyết trình, Thảo luận nhóm, Lab...
    - **Mô tả**: Cách áp dụng phương pháp
    - **Tần suất**: Mỗi tuần, 2 lần/tuần, Theo từng chương...
    - **Thời lượng**: 2 giờ, 1 buổi học...

### 3.6. Tài liệu (materials)
- Tài liệu được quản lý thông qua hệ thống Documents
- Mỗi tài liệu gắn với syllabus thông qua `entity_type = 'course_syllabus'` và `entity_id`
- Loại tài liệu:
  - syllabus: Đề cương
  - textbook: Sách giáo khoa
  - reference: Tài liệu tham khảo
  - assignment: Bài tập
  - exam: Đề thi
  - other: Khác
- Có thể upload nhiều file, mỗi file có mô tả riêng
- Tài liệu có thể được liên kết với các tuần trong Weekly Plan

### 3.7. Quy định (policies)
- **Quy định về điểm danh**: Quy định vắng mặt, điểm danh, hậu quả
- **Quy định về nộp bài trễ**: Quy định về việc nộp bài tập, báo cáo trễ hạn
- **Quy định về tính trung thực học thuật**: Quy định về đạo văn, gian lận
- **Thông tin liên hệ**:
  - **Email giảng viên**: Email để sinh viên liên hệ
  - **Giờ làm việc (Office Hours)**: Thời gian giảng viên tiếp sinh viên

### 3.8. Rubrics (rubrics)
- Danh sách các rubric chấm điểm
- Mỗi rubric gồm:
  - **Mã rubric**: Mã ngắn gọn (VD: PRJ, ASS, QUIZ)
  - **Tên rubric**: Tên đầy đủ (VD: Project cuối kỳ, Bài tập lớn)
  - **Danh sách tiêu chí**:
    - Mỗi tiêu chí có:
      - **Tên tiêu chí**: VD: Hiểu bài toán, Thiết kế & cài đặt...
      - **Trọng số (%)**: Phần trăm điểm của tiêu chí (0-100)
    - Tổng trọng số các tiêu chí trong một rubric phải bằng 100%

## 4. Quy tắc validation

### 4.1. Validation chung
- Tất cả các trường bắt buộc phải được điền trước khi lưu
- Course Version phải tồn tại và thuộc về Course đúng

### 4.2. Validation Assessment Plan
- Tổng trọng số các thành phần đánh giá phải bằng 100%
- Mỗi thành phần phải có tên và loại

### 4.3. Validation Rubrics
- Mỗi rubric phải có mã và tên
- Tổng trọng số các tiêu chí trong một rubric phải bằng 100%

### 4.4. Validation Weekly Plan
- Số tuần phải là số nguyên dương (≥ 1)
- Chủ đề tuần là bắt buộc
- Thời lượng tuần phải ≥ 0

### 4.5. Validation Learning Outcomes
- Mỗi CLO phải có mã và mô tả
- Mã CLO nên duy nhất trong một đề cương

## 5. Quy trình làm việc

### 5.1. Tạo đề cương mới
1. Chọn Course và Course Version
2. Điền các thông tin trong các tab:
   - Thông tin cơ bản
   - Mục tiêu học tập
   - Kế hoạch tuần
   - Kế hoạch đánh giá
   - Phương pháp giảng dạy
   - Tài liệu (upload sau khi lưu đề cương)
   - Quy định
   - Rubrics
3. Thiết lập metadata: trạng thái, ngôn ngữ, ngày hiệu lực, is_current
4. Lưu đề cương
5. Nếu cần, upload tài liệu trong tab Materials

### 5.2. Chỉnh sửa đề cương
1. Truy cập trang đề cương của Course Version
2. Hệ thống tự động tải đề cương hiện tại (is_current = true) hoặc phiên bản mới nhất
3. Chỉnh sửa các thông tin trong các tab
4. Lưu để cập nhật đề cương

### 5.3. Tạo phiên bản mới
- Có thể tạo phiên bản mới bằng cách tạo đề cương mới với `version_no` cao hơn
- Hoặc copy từ đề cương cũ và chỉnh sửa

### 5.4. Kích hoạt đề cương
- Đặt `is_current = true` cho một đề cương sẽ tự động hủy kích hoạt các đề cương khác của cùng Course Version

## 6. Lưu ý kỹ thuật

### 6.1. Lưu trữ dữ liệu
- Các thành phần chính của đề cương được lưu trong các trường JSONB:
  - `basic_info`: JSONB
  - `learning_outcomes`: JSONB
  - `weekly_plan`: JSONB (mảng)
  - `assessment_plan`: JSONB
  - `teaching_methods`: JSONB
  - `materials`: JSONB (thông tin metadata, file lưu riêng)
  - `policies`: JSONB
  - `rubrics`: JSONB

### 6.2. Liên kết Documents
- Tài liệu được lưu trong bảng Documents với `entity_type = 'course_syllabus'`
- Trong Weekly Plan, có thể tham chiếu đến Documents thông qua `materials_documents` (mảng ID)

### 6.3. Versioning
- Mỗi đề cương có `version_no` riêng
- Cho phép nhiều phiên bản cùng tồn tại
- Hệ thống tự động quản lý số phiên bản

## 7. Tích hợp

### 7.1. Tích hợp với Course Version
- Đề cương phải gắn với một Course Version
- Khi xóa Course Version, tất cả đề cương liên quan sẽ bị xóa (CASCADE)

### 7.2. Tích hợp với Documents
- Tài liệu được quản lý độc lập nhưng liên kết với syllabus
- Có thể upload, xem, sửa, xóa tài liệu từ trang Materials

### 7.3. Tích hợp với PLO
- CLO có thể mapping với Program Learning Outcomes (PLO)
- Hiện tại chỉ lưu danh sách mã PLO, chưa có validation

