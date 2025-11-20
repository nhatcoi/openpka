## 3. Đặc tả yêu cầu phi chức năng – OpenPKA

Tài liệu này mô tả chi tiết nhóm yêu cầu phi chức năng (Non-Functional Requirements – NFR) cho hệ thống quản lý đại học OpenPKA/OpenAcademix. Các yêu cầu dưới đây dùng để kiểm tra chất lượng triển khai, làm tiêu chí nghiệm thu và là cơ sở cho kế hoạch vận hành – bảo trì. Mỗi mục bao gồm tiêu chí định lượng, phương pháp đo/kiểm thử và trách nhiệm giám sát.

### 3.1 Tính khả dụng (Availability & Usability)

| ID | Hạng mục | Yêu cầu | Cách đo/kiểm thử | Chủ thể chịu trách nhiệm |
| --- | --- | --- | --- | --- |
| AV-01 | Mức độ sẵn sàng dịch vụ | Hệ thống phải đạt tối thiểu 99.5% uptime/năm (không tính khung bảo trì đã thông báo trước ≥24h). | Theo dõi qua dashboard giám sát (UptimeRobot/NewRelic). Báo cáo hàng tháng. | DevOps/Infra |
| AV-02 | Khả năng phục hồi | Tất cả container (Next.js, API, Postgres) được orchestration qua Docker Compose/Kubernetes với chế độ auto-restart và health-check 30s/lần. Khi phát hiện ≥3 lỗi 5xx liên tiếp, lưu lượng phải được chuyển sang instance dự phòng (blue-green hoặc canary trên Vercel). | Giả lập sự cố bằng cách tắt một instance, quan sát thời gian chuyển đổi. | DevOps |
| AV-03 | Phiên đăng nhập | Phiên đăng nhập có thời hạn 60 phút không thao tác, được làm mới thông qua refresh token an toàn. Khi session hết hạn, người dùng nhận thông báo rõ ràng và chuyển về trang đăng nhập, không mất dữ liệu đã nhập trong form (sử dụng local draft). | Kiểm thử bằng cách bỏ thao tác 60 phút, sau đó quay lại form. | QA |
| AV-04 | Giám sát UI | Các dashboard trung tâm phê duyệt (Org/HR/TMS/Finance) phải hiển thị trạng thái hàng chờ, cảnh báo backlog >24h vì hiện chưa bật notification tự động. | Manual test trên môi trường staging với dữ liệu giả lập. | Product Owner |
| AV-05 | Khả năng tiếp cận | Frontend phải áp dụng chuẩn WCAG 2.1 mức AA tối thiểu (contrast, keyboard navigation, aria-label cho nút hành động quan trọng). | Dùng Lighthouse/Axe để scan định kỳ. | Frontend Lead |

### 3.2 Hiệu năng (Performance & Scalability)

| ID | Hạng mục | Yêu cầu | Cách đo/kiểm thử | Chủ thể |
| --- | --- | --- | --- | --- |
| PF-01 | Công suất xử lý | Hệ thống phục vụ tối thiểu 500 user đồng thời, 3.000 request/phút với tỷ lệ lỗi <1% trong giờ cao điểm (đăng ký CTĐT, nhập học phí). | Stress test bằng k6/JMeter trên môi trường staging. | QA Performance |
| PF-02 | Thời gian phản hồi API | - CRUD chuẩn (OrgUnit, Employee, Program) trả kết quả <1.5s với trang 50 bản ghi.<br>- Báo cáo tổng hợp lớn (lịch sử học phí 5 năm, workflow log) <5s nhờ pagination + streaming. | Tạo bộ test Postman + monitor tự động. | Backend Lead |
| PF-03 | Caching & ISR | Next.js App Router phải bật ISR cho trang dashboard (revalidate 300s) và sử dụng cache phân tầng (Edge cache + Redis optional) để giảm tải truy vấn lặp. Các trang form/phê duyệt luôn dynamic nhằm tránh dữ liệu lỗi thời. | Kiểm tra `Cache-Control` header và log revalidate. | Frontend Lead |
| PF-04 | Cơ sở dữ liệu | - Bảng nghiệp vụ có index trên khóa chính, cột lọc (`status`, `code`, `workflow_state`).<br>- Chạy `VACUUM ANALYZE` ít nhất 1 lần/ngày; theo dõi thống kê bloat >20%.<br>- Các thao tác lớn (import CTĐT, sync học phí) chạy background job, không block request chính. | Review migration + job scheduler. | DBA |
| PF-05 | Tài nguyên | CPU server ≤70%, RAM ≤80% trong 95% thời gian hoạt động. Nếu vượt ngưỡng 15 phút cần auto-scale hoặc gửi cảnh báo Slack/Lark. | Monitor Prometheus/Grafana. | DevOps |

### 3.3 An toàn bảo mật (Security)

| ID | Hạng mục | Yêu cầu | Cách đo/kiểm thử | Chủ thể |
| --- | --- | --- | --- | --- |
| SEC-01 | Xác thực & phân quyền | - Middleware bắt buộc đăng nhập trên mọi route `/org`, `/hr`, `/tms`, `/finance`.<br>- RBAC chi tiết dựa trên module + action (`org_unit.unit.approve`, `tms.program.publish`, …); UI chỉ hiển thị nút hành động khi user có quyền tương ứng.<br>- Đổi mật khẩu định kỳ 90 ngày cho tài khoản đặc quyền (Admin, HR Manager). | Unit test middleware + kiểm thử vai trò. | Backend Lead |
| SEC-02 | Truyền thông an toàn | Bắt buộc HTTPS/TLS 1.2+, bật HSTS tại reverse proxy. Payload nhạy cảm (token, mật khẩu, thông tin tài chính) mã hóa khi lưu: bcrypt 12 rounds cho password, AES-256-GCM cho secret lưu trong DB. | Kiểm thử SSL Labs, audit cấu hình proxy. | DevOps |
| SEC-03 | Quản lý bí mật | Tất cả biến môi trường (DB URL, API keys) lưu trong secret manager (Vercel/1Password/GCP Secret). Không commit vào Git. Quy trình rotation tối đa 180 ngày. | Rà soát repo + pipeline CI. | DevOps |
| SEC-04 | Nhật ký & truy vết | Log hành động ghi tối thiểu: actor, vai trò, hành động, timestamp, payload tóm tắt. Không xóa/thay đổi log thủ công; lưu trữ tối thiểu 6 tháng. | Kiểm tra bảng `audit_logs`, review retention. | Security Officer |
| SEC-05 | Kiểm thử bảo mật | Thực hiện quét OWASP Top 10 (XSS, CSRF, SQLi, IDOR, SSRF, file upload) mỗi quý; chạy `npm audit` + `prisma migrate diff` trong pipeline. | Lưu kết quả scan + remediation SLA 30 ngày. | Security Officer |
| SEC-06 | Bảo vệ dữ liệu cá nhân | Dữ liệu nhân sự (CMND, hợp đồng) phải được phân lớp “Confidential”; chỉ HR/Authorized roles truy cập. Truy cập được log và cảnh báo khi download hàng loạt (>200 bản ghi). | Thiết lập Data Loss Prevention rule. | HR Data Steward |

### 3.4 Tính an toàn & độ tin cậy (Safety & Reliability)

| ID | Hạng mục | Yêu cầu | Cách đo/kiểm thử | Chủ thể |
| --- | --- | --- | --- | --- |
| SAF-01 | Sao lưu & khôi phục | - Backup Postgres full hằng ngày lúc 02:00, incremental mỗi 6h.<br>- Giữ bản sao lưu ≥30 ngày, lưu trên storage tách biệt (S3/Backblaze).<br>- Kiểm tra restore môi trường staging 2 tháng/lần. | Thực hiện diễn tập restore, lập biên bản. | DBA |
| SAF-02 | Giao dịch nguyên tử | Các nghiệp vụ quan trọng (tạo OrgUnit + workflow instance, cấp học phí, phê duyệt CTĐT) phải chạy trong transaction. Nếu một bước thất bại, toàn bộ rollback để tránh trạng thái dở dang. | Viết test mô phỏng lỗi giữa chừng. | Backend Lead |
| SAF-03 | Quy trình ứng cứu sự cố | Định nghĩa Incident Response Plan: Mức độ (Sev1-Sev3), kênh báo cáo, thời gian phản hồi ban đầu <30 phút, RTO 4h, RPO 1h cho dữ liệu nghiệp vụ. Báo cáo hậu kiểm (post-mortem) trong 72h sau sự cố. | Đánh giá qua tabletop exercise mỗi quý. | Ops Manager |
| SAF-04 | Kiểm soát thao tác rủi ro | Các hành động phá hủy/ghi đè dữ liệu (force update tuition, suspend org tree) yêu cầu xác nhận kép (modal + nhập mã xác nhận). UI hiển thị cảnh báo rõ về hậu quả. | UX review trên staging. | Product/UX |
| SAF-05 | Bất biến dữ liệu lịch sử | Lịch sử tổ chức, CTĐT, học phí, workflow không được xóa vật lý. Chỉ cho phép ghi trạng thái “inactive”, đảm bảo audit trail đầy đủ để khôi phục khi cần. | Kiểm tra constraint DB và API (không expose DELETE hard). | DBA + Backend |
| SAF-06 | Giám sát rủi ro đồng thời | Khi nhiều người cùng chỉnh một tài nguyên (ví dụ syllabus), hệ thống phải khóa cấp bản ghi hoặc cảnh báo “Someone is editing”. Bản lưu cuối cùng được version hóa để có thể quay lại phiên bản trước. | Test với 2 user thao tác song song. | QA |

### Phụ lục A – Ma trận kiểm thử & nghiệm thu

| ID | Giai đoạn kiểm thử | Kịch bản chính | Tiêu chí đạt |
| --- | --- | --- | --- |
| AV-01/02 | UAT + Monitoring | Tắt 1 replica API trong giờ làm việc và quan sát failover | Tối đa 1 phút gián đoạn, log sự kiện đầy đủ |
| PF-01/02 | Performance Test | K6 script mô phỏng 500 user đăng nhập, tạo OrgUnit, duyệt CTĐT | P95 <1.5s, tỷ lệ lỗi <1% |
| SEC-01/05 | Security Audit | Pen-test internal, fuzzing API, xác minh CSRF token | Không có lỗ hổng mức High/Critical, medium fix <14 ngày |
| SAF-01 | DR Drill | Restore backup ngày T-7 vào staging, đo thời gian | Hoàn tất <4h, dữ liệu khớp 100% |

Tài liệu này phải được cập nhật khi có thay đổi kiến trúc hoặc chính sách vận hành. Mỗi quý, nhóm dự án cần rà soát trạng thái đáp ứng NFR và lập báo cáo cho giảng viên hướng dẫn/ban quản lý dự án.

