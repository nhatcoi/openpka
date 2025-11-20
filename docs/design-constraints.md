## 4. Các ràng buộc thiết kế và cài đặt – OpenPKA

Những ràng buộc dưới đây phản ánh điều kiện tiên quyết mà hệ thống quản lý đại học OpenPKA phải tuân thủ trong suốt vòng đời phát triển và vận hành. Chúng giúp đảm bảo giải pháp tương thích với hạ tầng hiện hữu của Đại học Phenikaa, đáp ứng các chuẩn bảo mật – pháp lý và duy trì được khả năng mở rộng trong tương lai.

### 4.1 Ràng buộc về công nghệ

| ID | Nội dung | Mô tả chi tiết | Tác động |
| --- | --- | --- | --- |
| TECH-01 | Ngăn xếp bắt buộc | Frontend và Backend chạy chung trên Next.js App Router (TypeScript). Không sử dụng framework khác để tránh phân tán công nghệ. | Quy định cách tổ chức module `(org)`, `(hr)`, `(tms)`,… và chuẩn hóa code style (ESLint, Prettier). |
| TECH-02 | ORM và DB | Prisma ORM kết nối PostgreSQL duy nhất; không dùng song song ORM khác hay NoSQL để giảm độ phức tạp giao tác. | Các migration phải thông qua `prisma migrate`, bảo đảm đồng bộ schema trên mọi môi trường. |
| TECH-03 | Thư viện UI | Hệ thống sử dụng Material UI + custom design system hiện hữu. Các module mới phải tái sử dụng component chung (`src/components/*`). | Giảm rủi ro không nhất quán UI, hỗ trợ tái sử dụng theme của trường. |
| TECH-04 | Ngôn ngữ lập trình | Toàn bộ dịch vụ viết bằng TypeScript; không chấp nhận code mới bằng Java/Python cho đến khi có phê duyệt kiến trúc. | Tối ưu năng lực đội ngũ, đơn giản hóa toolchain. |
| TECH-05 | Tự động hóa | Pipeline CI/CD bắt buộc chạy `npm run lint`, `npm run test`, `prisma migrate diff` trước khi deploy lên môi trường thử nghiệm hoặc production. | Ngăn migration lỗi và giữ chất lượng mã. |

### 4.2 Ràng buộc về hạ tầng triển khai

| ID | Nội dung | Mô tả chi tiết | Tác động |
| --- | --- | --- | --- |
| INFRA-01 | Kiến trúc triển khai | Hệ thống chạy trên Docker (docker-compose cho local, container orchestration hoặc Vercel/Render cho production). Không triển khai trực tiếp trên máy vật lý để đảm bảo tính tái lập. | Quy định đóng gói dịch vụ, cho phép scale out dễ dàng. |
| INFRA-02 | Mạng & truy cập | Máy chủ đặt trong hạ tầng CNTT của trường, kết nối Internet ≥ 100 Mbps, hỗ trợ VPN nội bộ cho quản trị. | Đảm bảo người dùng nội bộ và từ xa truy cập ổn định. |
| INFRA-03 | Sao lưu & lưu trữ | PostgreSQL cần bộ nhớ SSD ≥ 500 GB, backup remote (S3/Backblaze) hằng ngày. File upload được lưu ở `public/uploads` và đồng bộ sang kho lưu trữ nội bộ. | Đảm bảo an toàn dữ liệu và dung lượng đủ cho hồ sơ nhân sự, CTĐT. |
| INFRA-04 | Giám sát | Phải có hệ thống giám sát (Prometheus/Grafana hoặc tương đương) ghi nhận CPU, RAM, dung lượng đĩa, độ trễ API. | Cung cấp căn cứ SLA và cảnh báo sớm. |
| INFRA-05 | Khả năng mở rộng | Cấu hình hạ tầng phải hỗ trợ scale theo module (Org/HR/TMS/Finance) bằng cách chạy nhiều replica, cân bằng tải qua reverse proxy (NGINX/Traefik). | Đảm bảo đáp ứng mùa cao điểm (đăng ký CTĐT, chốt học phí). |

### 4.3 Ràng buộc về tích hợp hệ thống

| ID | Nội dung | Mô tả chi tiết | Tác động |
| --- | --- | --- | --- |
| INT-01 | Đồng bộ dữ liệu hiện hữu | Dữ liệu tổ chức và nhân sự ban đầu được nhập từ hệ thống hiện tại (Excel/Google Sheet). Phải có cơ chế import qua API hoặc upload file CSV chuẩn hóa. | Bảo đảm kế thừa dữ liệu lịch sử mà không nhập tay. |
| INT-02 | Chuẩn API | Mọi API nội bộ tuân theo RESTful với JSON, đặt tên `/api/{module}/{resource}`; phản hồi lỗi dùng HTTP status chuẩn + payload `{code, message, details}`. | Tạo tính thống nhất giữa các module, dễ cho client sử dụng. |
| INT-03 | Kết nối hệ thống tương lai | Thiết kế phải dự phòng để tích hợp LMS, cổng thanh toán và hệ thống email nội bộ trong các phiên bản sau. Các điểm tích hợp được mô tả bằng interface rõ ràng (webhook, message queue). | Giảm chi phí chuyển đổi về sau. |
| INT-04 | Workflow & Notification | Trước khi có notification tự động, mọi yêu cầu phê duyệt phải lưu trong bảng workflow để các module truy cập chung. API workflow không được thay đổi schema đột ngột. | Đảm bảo các phân hệ dùng chung nguồn dữ liệu phê duyệt. |

### 4.4 Ràng buộc về bảo mật và định danh

| ID | Nội dung | Mô tả chi tiết | Tác động |
| --- | --- | --- | --- |
| SEC-01 | Chuẩn xác thực | Sử dụng xác thực phiên (session token ký HMAC) kết hợp middleware chặn truy cập trái phép. Khi mở rộng, có thể tích hợp SSO nội bộ thông qua OAuth2/OpenID Connect, nhưng phải giữ tương thích ngược. | Giữ trải nghiệm đăng nhập đồng nhất và dễ mở rộng. |
| SEC-02 | Phân quyền | RBAC chi tiết theo module – action, ánh xạ trực tiếp vào bảng `user_roles`, `permissions`. Không cho phép hard-code quyền trong UI. | Tăng tính kiểm soát và dễ audit. |
| SEC-03 | Bảo vệ dữ liệu | Tất cả kết nối dùng HTTPS, dữ liệu nhạy cảm mã hóa khi lưu. Nhật ký truy cập phải lưu tối thiểu 180 ngày để phục vụ kiểm toán. | Tuân thủ yêu cầu bảo mật nội bộ trường. |
| SEC-04 | Quản lý định danh | Mỗi người dùng có duy nhất một tài khoản dựa trên email tổ chức (`@phenikaa-uni.edu.vn`). Người dùng bên ngoài chỉ được cấp tài khoản khi có chấp thuận của Ban CNTT. | Kiểm soát truy cập và tuân thủ quy định nhân sự. |
| SEC-05 | Kiểm tra bảo mật | Trước mỗi lần phát hành lớn, phải chạy kiểm thử bảo mật (OWASP Top 10) và rà soát dependency bằng `npm audit`. | Ngăn rủi ro bảo mật lọt vào môi trường thật. |

### 4.5 Ràng buộc về pháp lý và quy định ngành

| ID | Nội dung | Mô tả chi tiết | Tác động |
| --- | --- | --- | --- |
| LAW-01 | Tuân thủ pháp luật Việt Nam | Hệ thống phải tuân thủ Luật An ninh mạng 2018, Nghị định 53/2022/NĐ-CP và các quy định về bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP). | Đảm bảo dữ liệu sinh viên/giảng viên được bảo vệ đúng pháp lý. |
| LAW-02 | Chuẩn giáo dục | Quy trình quản lý CTĐT, học phí phải đáp ứng yêu cầu của Bộ GD&ĐT về lưu trữ hồ sơ, kiểm định (ví dụ Thông tư 04/2016/TT-BGDĐT, 07/2020/TT-BGDĐT). | Giúp nhà trường thuận lợi trong công tác kiểm định chất lượng. |
| LAW-03 | Lưu trữ hồ sơ | Hồ sơ nhân sự, học phí, quyết định phê duyệt phải lưu tối thiểu 10 năm (theo quy định lưu trữ công tác tổ chức – tài chính). | Xác định chiến lược lưu trữ dài hạn và backup. |
| LAW-04 | Bản quyền phần mềm | Chỉ sử dụng thư viện nguồn mở có giấy phép tương thích (MIT, Apache-2.0). Thư viện thương mại phải có thỏa thuận bản quyền rõ ràng. | Tránh rủi ro pháp lý khi triển khai chính thức. |

## 5. Các giả thiết và sự phụ thuộc nghiệp vụ

| ID | Loại | Nội dung | Tác động/ghi chú |
| --- | --- | --- | --- |
| ASM-01 | Giả thiết người dùng | Người dùng nội bộ (Phòng Tổ chức Nhân sự, Phòng Đào tạo, Tài chính) có kiến thức nghiệp vụ và sẵn sàng tham gia đào tạo sử dụng hệ thống mới. | Hỗ trợ triển khai đào tạo người dùng cuối (UAT & chuyển giao). |
| ASM-02 | Giả thiết dữ liệu | Dữ liệu cơ cấu tổ chức, nhân sự, chương trình đào tạo hiện có được cung cấp đầy đủ và đúng định dạng trước khi migrate. | Nếu dữ liệu thiếu, tiến độ triển khai sẽ bị trì hoãn. |
| ASM-03 | Giả thiết hạ tầng | Nhà trường cung cấp máy chủ/ dịch vụ cloud đủ cấu hình và tài nguyên mạng để triển khai (CPU, RAM, băng thông như mô tả phần 4.2). | Nếu không đáp ứng, cần bổ sung ngân sách hạ tầng. |
| ASM-04 | Sự phụ thuộc quy trình | Quy trình phê duyệt (Org, HR, TMS, Finance) sẽ tiếp tục vận hành thủ công (dashboard) cho đến khi ban CNTT phê duyệt hệ thống notification. | Tài liệu thiết kế workflow phải dự phòng tích hợp notification sau này. |
| ASM-05 | Sự phụ thuộc tích hợp | Các hệ thống khác (LMS, cổng thanh toán, email nội bộ) chưa sẵn sàng tích hợp trong phiên bản 1.0; nhóm dự án chỉ cần cung cấp API/placeholder đã thiết kế. | Giữ giao diện tích hợp ở trạng thái “Coming Soon” và ghi rõ trong tài liệu hướng dẫn. |
| ASM-06 | Giả thiết vận hành | Ban CNTT duy trì đội ngũ DevOps/Support trực 8x5 (08h-17h) và chế độ on-call ngoài giờ cho sự cố Sev1. | Là cơ sở để thiết lập SLA và quy trình Incident Response. |

Tài liệu này phải được cập nhật ngay khi có sự thay đổi về hạ tầng, chính sách bảo mật, hoặc khi nhà trường ban hành quy định mới ảnh hưởng đến hệ thống OpenPKA.

