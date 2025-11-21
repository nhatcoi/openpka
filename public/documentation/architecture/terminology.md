
# **I. Thuật ngữ & Ký hiệu Chính**

### 1. Hệ thống vai trò trong mô hình RASCI

| Thuật ngữ   | Viết tắt | Giải thích                                               |
| ----------- | -------- | -------------------------------------------------------- |
| Responsible | **R**    | Người trực tiếp thực hiện công việc.                     |
| Accountable | **A**    | Người chịu trách nhiệm cuối cùng và phê duyệt kết quả.   |
| Support     | **S**    | Người hỗ trợ chuyên môn, không chịu trách nhiệm kết quả. |
| Informed    | **I**    | Người được thông báo tiến độ/kết quả.                    |

### 2. Tổ chức & quản trị

| Thuật ngữ            | Viết tắt | Giải thích                                                 |
| -------------------- | -------- | ---------------------------------------------------------- |
| Phòng Đào tạo        | **PĐT**  | Bộ phận phụ trách đào tạo.                                 |
| Ban Giám hiệu        | **BGH**  | Cấp lãnh đạo cao nhất (Hiệu trưởng + các Phó Hiệu trưởng). |
| Hội đồng Khoa học    | **HĐKH** | Hội đồng thẩm định chuyên môn.                             |
| Chương trình đào tạo | **CTĐT** | Tập hợp các học phần cấu thành một chương trình.           |

### 3. Thuật ngữ trong tài liệu

| Thuật ngữ  | Viết tắt | Giải thích                  |
| ---------- | -------- | --------------------------- |
| Use Case   | **UC**   | Trường hợp sử dụng.         |
| Front-end  | **FE**   | Giao diện người dùng.       |
| Back-end   | **BE**   | Xử lý logic – API.          |
| Database   | **DB**   | Cơ sở dữ liệu.              |
| Constraint | –        | Ràng buộc dữ liệu.          |
| Index      | –        | Chỉ mục tối ưu truy vấn.    |
| Trigger    | –        | Thủ tục kích hoạt trong DB. |
| IEEE       | **IEEE** | Chuẩn trích dẫn tài liệu.   |

---

# **II. Thuật ngữ Công nghệ & Kỹ thuật**

### 1. Công nghệ chính

| Thuật ngữ        | Lĩnh vực | Giải thích                         |
| ---------------- | -------- | ---------------------------------- |
| **OpenAcademix** | Dự án    | Hệ thống quản lý đại học Phenikaa. |
| Next.js          | FE/BE    | Framework React (App Router, TS).  |
| PostgreSQL       | DB       | Hệ quản trị CSDL (v15+).           |
| Prisma ORM       | BE       | ORM kết nối PostgreSQL.            |
| TypeScript       | FE/BE    | Ngôn ngữ chính của hệ thống.       |
| Material UI      | FE       | UI framework (MUI 7.3.2).          |

### 2. DevOps – Bảo mật – Hiệu năng

| Thuật ngữ            | Nhóm          | Giải thích                        |
| -------------------- | ------------- | --------------------------------- |
| CI/CD Pipeline       | DevOps        | Tự động test + deploy.            |
| Docker/Compose       | Hạ tầng       | Đóng gói & triển khai dịch vụ.    |
| Vercel/Render        | Deploy        | Triển khai môi trường production. |
| RESTful API          | API           | Chuẩn giao tiếp HTTP + JSON.      |
| RBAC                 | Bảo mật       | Phân quyền theo Role–Action.      |
| HTTPS/TLS            | Bảo mật       | Mã hóa giao tiếp (TLS 1.2+).      |
| OWASP Top 10         | Bảo mật       | Bộ tiêu chuẩn kiểm thử bảo mật.   |
| SQLi / XSS / CSRF    | Bảo mật       | Nhóm lỗi phổ biến phải kiểm thử.  |
| ISR                  | Hiệu năng     | Incremental Static Regeneration.  |
| k6 / JMeter          | Testing       | Stress test hệ thống.             |
| Prometheus / Grafana | Monitoring    | Theo dõi hiệu năng & logs.        |
| WCAG 2.1 AA          | Accessibility | Chuẩn khả năng tiếp cận FE.       |

---

# **III. Thuật ngữ Nghiệp vụ & Quản lý Đại học**

### 1. Bộ phận & Vai trò

| Thuật ngữ               | Giải thích                                 |
| ----------------------- | ------------------------------------------ |
| Phòng Tổ chức Nhân sự   | Quản lý nhân sự, định biên, phân công.     |
| Phòng Tài chính Kế toán | Quản lý học phí, báo cáo chi phí.          |
| Học vụ – Sinh viên      | Quản lý hồ sơ sinh viên và tiến trình học. |

### 2. Thuật ngữ đào tạo

| Thuật ngữ         | Giải thích                                                |
| ----------------- | --------------------------------------------------------- |
| Học phần          | Đơn vị giảng dạy.                                         |
| Tín chỉ           | Đơn vị đo khối lượng học tập.                             |
| Học phí tối thiểu | Đơn giá tín chỉ × tổng tín chỉ tối thiểu.                 |
| Bậc đào tạo       | Đại học / Thạc sĩ / Tiến sĩ.                              |
| Khối kiến thức    | GENERAL / CORE / MAJOR / ELECTIVE / FOUNDATION / SUPPORT. |

### 3. Thuật ngữ tổ chức – vận hành

| Thuật ngữ            | Giải thích                                                         |
| -------------------- | ------------------------------------------------------------------ |
| Biên chế (định biên) | Số lượng nhân sự cho từng chức danh.                               |
| Nhiệm kỳ             | Thời hạn đảm nhiệm chức danh trong đơn vị.                         |
| Trạng thái nghiệp vụ | DRAFT, REVIEWING, APPROVED, ACTIVE, INACTIVE, REJECTED, PUBLISHED. |
| Thao tác nguyên tử   | Nghiệp vụ chạy trong transaction (fail → rollback).                |

### 4. Tài liệu dự án

| Thuật ngữ                 | Giải thích                            |
| ------------------------- | ------------------------------------- |
| Yêu cầu chức năng         | Functional Requirements.              |
| Yêu cầu phi chức năng     | Non-Functional Requirements (NFR).    |
| Quản lý đề cương chi tiết | Module xây dựng & phê duyệt syllabus. |
| UAT                       | Kiểm thử chấp nhận người dùng.        |
| MVP                       | Sản phẩm khả dụng tối thiểu.          |

---

# **IV. Modules & Schemas trong Cơ sở Dữ liệu (PostgreSQL)**

Hệ thống gồm **11 schema**, mỗi schema tương ứng với một module nghiệp vụ độc lập.

| Module                         | Schema         | Phạm vi                                    |
| ------------------------------ | -------------- | ------------------------------------------ |
| **Human Resources**            | `hr`           | Nhân sự, hồ sơ, lịch sử công tác.          |
| **Training Management System** | `academic`     | Học phần, chương trình, khóa học.          |
| **Organization**               | `org`          | Cơ cấu tổ chức, đơn vị, vai trò, nhiệm kỳ. |
| **Finance**                    | `finance`      | Học phí, mã phí, cấu hình tài chính.       |
| **Workflow**                   | `workflow`     | Quy trình phê duyệt, luồng xử lý.          |
| **Notification**               | `notification` | Gửi thông báo hệ thống.                    |
| **Authentication**             | `auth`         | Đăng nhập, phân quyền, session.            |
| **Report**                     | `report`       | Báo cáo, thống kê.                         |
| **Public**                     | `public`       | Dữ liệu dùng chung.                        |
| **Schedule**                   | `schedule`     | Lịch học, thời khóa biểu.                  |
| **Student**                    | `student`      | Hồ sơ sinh viên, kết quả học tập.          |

---

