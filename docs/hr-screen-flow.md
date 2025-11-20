# Luồng màn hình module HR

Tập tin `docs/hr-screen-flow.puml` mô tả sơ đồ tổng quan hành trình người dùng trong hệ thống nhân sự. Nội dung chính bằng tiếng Việt, nhưng để tiện theo dõi nhanh, phần dưới đây giải thích từng cụm màn hình:

1. **Truy cập & xác thực**
   - Người dùng mở `/hr` hoặc bất kỳ route con.
   - Nếu chưa đăng nhập sẽ bị chuyển về `/auth/signin`.
   - Sau khi xác thực, `HrLayout` render AppBar, NewSidebar và vùng nội dung.

2. **Dashboard chung**
   - `/hr/dashboard` hiển thị KPI nhân sự, cảnh báo và lối tắt thường dùng.
   - Người dùng chọn nghiệp vụ thông qua Sidebar.

3. **Quản lý nhân sự**
   - `/hr/employees`: danh sách nhân sự.
   - `/hr/employees/{id}`: xem hồ sơ, tab thông tin, chỉnh sửa, lịch sử.
   - `/hr/employees/new`: tạo hồ sơ mới.
   - `/hr/employments`: hợp đồng/biên chế.

4. **Cây & cơ cấu**
   - `/hr/org-tree` và `/hr/org-tree/{id}`: cấu trúc tổ chức dạng cây, xem nhân sự theo nút.
   - `/hr/org-structure`, `/hr/university-overview`: thuộc tính, số liệu theo đơn vị.

5. **Đào tạo & năng lực**
   - `/hr/trainings`, `/hr/employee-trainings`: khóa học, lịch sử tham gia.
   - `/hr/qualifications`, `/hr/employee-qualifications`: bằng cấp, chứng chỉ.
   - `/hr/academic-titles`, `/hr/employee-academic-titles`: học hàm học vị.

6. **Đánh giá & hiệu suất**
   - `/hr/performance-reviews`, `/hr/evaluation-periods`, `/hr/my-evaluations`, `/hr/evaluation-demo`: chu kỳ đánh giá, biểu mẫu, kết quả cá nhân.

7. **Nghỉ phép & thay đổi**
   - `/hr/leave-requests` + `history`: đơn nghỉ và lịch sử.
   - `/hr/employee-changes/history`, `/hr/employee-logs`: thay đổi thông tin, log hành động.

8. **Phân quyền & bảo mật**
   - `/hr/roles`, `/hr/permissions`, `/hr/role-permissions`, `/hr/user-roles`: quản lý role/permission.
   - `/hr/assignments`: phân công vai trò cho người dùng.
   - `/hr/change-password`: kênh đổi mật khẩu nhanh.

9. **Báo cáo & hồ sơ cá nhân**
   - `/hr/reports`, `/hr/faculty`: thống kê chuyên sâu theo đơn vị/khoa.
   - `/hr/profile`: trang thông tin cá nhân cho mỗi người dùng.

> Để xem sơ đồ, mở `docs/hr-screen-flow.puml` bằng PlantUML (VSCode plugin, IntelliJ hoặc http://www.plantuml.com/plantuml).  
> Mọi nhánh đều được chú thích tiếng Việt, nên tài liệu này đóng vai trò bổ sung mô tả văn bản.

