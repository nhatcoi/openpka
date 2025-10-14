# 📊 Notification System Diagrams

Bộ sơ đồ PlantUML mô tả kiến trúc và luồng hoạt động của hệ thống notification và workflow phê duyệt đa cấp.

## 📁 Danh sách sơ đồ

### 1. **`noti.puml`** - Database Schema Design (Full Version)
- **Mục đích**: Mô tả cấu trúc database và quan hệ giữa các bảng
- **Nội dung**:
  - 9 bảng chính trong schema `notification`
  - Foreign keys và constraints
  - Indexes và triggers
  - Notes về các giá trị enum

### 2. **`database_simple.puml`** - Database Schema (Simple Version)
- **Mục đích**: Phiên bản đơn giản của database schema
- **Nội dung**:
  - Core tables với relationships cơ bản
  - Dễ đọc và hiểu hơn
  - Phù hợp cho presentation

### 3. **`notification_flow.puml`** - Notification Flow
- **Mục đích**: Mô tả luồng hoạt động của notification system
- **Nội dung**:
  - Từ khi user khởi tạo workflow
  - Tạo notifications cho approvers
  - Xử lý phản hồi từ approvers
  - Escalation và reminder logic
  - Completion và notification kết quả

### 4. **`workflow_examples.puml`** - Workflow Examples (Full Version)
- **Mục đích**: Ví dụ cụ thể về các workflow phê duyệt
- **Nội dung**:
  - Course Approval Workflow (4 bước)
  - Leave Request Workflow (3 bước)
  - Organization Structure Workflow (3 bước)
  - Các loại notification types
  - Các loại entity types

### 5. **`workflow_simple.puml`** - Workflow Examples (Simple Version)
- **Mục đích**: Phiên bản đơn giản của workflow examples
- **Nội dung**:
  - Flow charts rõ ràng
  - Notes cho từng step
  - Dễ hiểu cho stakeholders

### 6. **`system_overview.puml`** - System Overview
- **Mục đích**: Tổng quan kiến trúc hệ thống
- **Nội dung**:
  - Các component chính
  - API layer
  - Business logic
  - Frontend components
  - External integrations

### 7. **`test_simple.puml`** - Test Simple
- **Mục đích**: File test để kiểm tra syntax PlantUML
- **Nội dung**:
  - Diagram đơn giản
  - Kiểm tra syntax cơ bản

### 8. **`all_workflows.puml`** - All Workflows Comprehensive
- **Mục đích**: Tất cả 12 workflow chính trong hệ thống
- **Nội dung**:
  - Course Approval Workflow
  - Program Approval Workflow
  - Major Approval Workflow
  - Leave Request Workflow
  - Organization Structure Workflow
  - Employee Hiring Workflow
  - Performance Review Workflow
  - Training Request Workflow
  - Evaluation Period Workflow
  - Financial Approval Workflow
  - Curriculum Update Workflow
  - Student Enrollment Workflow

### 9. **`workflow_roles_permissions.puml`** - Roles & Permissions
- **Mục đích**: Mô tả role hierarchy và permission mapping
- **Nội dung**:
  - Role hierarchy từ University Council đến Supervisor
  - Permission groups (TMS, HR, ORG, Finance, Student)
  - Workflow to role mapping
  - Escalation rules
  - Notification triggers
  - Workflow statuses

### 10. **`workflow_timeline.puml`** - Timeline & Dependencies
- **Mục đích**: Gantt chart timeline cho tất cả workflows
- **Nội dung**:
  - Processing timeline cho từng workflow
  - Step dependencies và durations
  - Academic, HR, Organizational, Student workflows
  - Timeout periods cho từng step

### 11. **`workflow_decision_tree.puml`** - Decision Tree
- **Mục đích**: Logic decision tree cho workflow routing
- **Nội dung**:
  - Workflow type classification
  - Amount-based routing
  - Duration-based routing
  - Position-level routing
  - Escalation and timeout handling

### 12. **`comprehensive_approval_system.puml`** - Comprehensive System Overview
- **Mục đích**: Tổng quan hệ thống phê duyệt toàn diện
- **Nội dung**:
  - 5 Organization Levels (Ministry → Individual)
  - 4 Approval Types (Organizational, Academic, Operational, Compliance)
  - 18+ Workflow Categories
  - Smart routing logic
  - Database schema design
  - User interface components

### 13. **`workflow_routing_matrix.puml`** - Routing Matrix
- **Mục đích**: Ma trận routing và quy tắc phê duyệt
- **Nội dung**:
  - Routing matrix table với thresholds
  - Workflow examples by category
  - Smart routing decision tree
  - Escalation rules và authority matrix
  - Timeout configurations

### 14. **`approval_architecture.puml`** - Architecture Diagram
- **Mục đích**: Kiến trúc hệ thống phê duyệt
- **Nội dung**:
  - 5-layer architecture (Presentation → Database)
  - Unified + Entity-specific approach
  - Service layer design
  - Data access patterns
  - Benefits visualization

## 🎯 Cách sử dụng

### **Xem sơ đồ online:**
1. Truy cập [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
2. Copy nội dung file `.puml`
3. Paste vào editor
4. Xem kết quả render

### **Xem sơ đồ local:**
```bash
# Cài đặt PlantUML (nếu chưa có)
npm install -g node-plantuml

# Render sơ đồ
puml generate noti.puml
puml generate notification_flow.puml
puml generate workflow_examples.puml
puml generate system_overview.puml
```

### **VSCode Extension:**
- Cài đặt extension "PlantUML"
- Mở file `.puml`
- Nhấn `Alt+D` để preview

## 📋 Giải thích các sơ đồ

### **Database Schema (noti.puml)**
```
notification_templates → notifications → notification_deliveries
                    ↓
                notification_queue
                    ↓
notification_preferences (user settings)

workflow_definitions → workflow_steps
         ↓
workflow_instances → approval_records
```

### **Notification Flow (notification_flow.puml)**
```
User Request → Workflow Instance → Notify Approvers → Wait Response
     ↓                                        ↓
  Timeout Check ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
     ↓
Escalation/Reminder → Next Step/Complete → Notify Result
```

### **Workflow Examples (workflow_examples.puml)**
- **Course**: Faculty → Academic Office → Academic Board → Dean
- **Leave**: Supervisor → HR → Director (if > 5 days)
- **Org**: Org Dept → Board → University Council

### **System Overview (system_overview.puml)**
```
Frontend → API Layer → Business Logic → Database
    ↓
External Systems (Email, SMS, Push, Slack)
```

## 🔧 Customization

### **Thay đổi theme:**
```plantuml
!theme plain
!theme cerulean
!theme spacelab
!theme united
```

### **Thay đổi colors:**
```plantuml
skinparam entity {
    BackgroundColor #E3F2FD
    BorderColor #1976D2
}
```

### **Thêm notes:**
```plantuml
note right of entity_name
  Your note content here
end note
```

## 🚨 Troubleshooting

### **Lỗi Syntax thường gặp:**

#### **1. Lỗi "Syntax Error"**
- **Nguyên nhân**: Có ký tự đặc biệt hoặc encoding không đúng
- **Giải pháp**: 
  - Sử dụng file `test_simple.puml` để test
  - Kiểm tra encoding UTF-8
  - Tránh ký tự đặc biệt trong title

#### **2. Lỗi "Cannot resolve"**
- **Nguyên nhân**: References không đúng
- **Giải pháp**:
  - Kiểm tra tên entity/component
  - Đảm bảo định nghĩa trước khi sử dụng

#### **3. Lỗi "Version too old"**
- **Nguyên nhân**: PlantUML version cũ
- **Giải pháp**:
  - Upgrade PlantUML từ [plantuml.com](https://plantuml.com/download)
  - Sử dụng online server mới nhất

### **Best Practices để tránh lỗi:**

#### **1. File Structure:**
```
@startuml DiagramName
!theme plain
skinparam backgroundColor #FFFFFF

title Simple Title

[Simple content here]

@enduml
```

#### **2. Naming Convention:**
- Sử dụng tiếng Anh cho tên entity
- Tránh ký tự đặc biệt
- Tên ngắn gọn, dễ hiểu

#### **3. Testing:**
- Test với file đơn giản trước
- Kiểm tra từng phần nhỏ
- Sử dụng online server để debug

### **Recommended Files cho testing:**
1. **`test_simple.puml`** - Test cơ bản
2. **`workflow_simple.puml`** - Test workflow
3. **`database_simple.puml`** - Test database schema

## 📝 Maintenance

### **Khi thay đổi database schema:**
1. Cập nhật `noti.puml` với bảng/trường mới
2. Cập nhật relationships nếu có
3. Thêm notes giải thích nếu cần

### **Khi thay đổi business logic:**
1. Cập nhật `notification_flow.puml`
2. Cập nhật `workflow_examples.puml`
3. Cập nhật `system_overview.puml`

### **Best practices:**
- Giữ sơ đồ đơn giản, dễ hiểu
- Sử dụng colors nhất quán
- Thêm notes giải thích khi cần
- Regular review và update

## 🚀 Next Steps

1. **Integration với codebase** - Cập nhật Prisma schema
2. **API Development** - Tạo REST APIs
3. **Frontend Development** - Tạo UI components
4. **Testing** - Unit tests và integration tests
5. **Documentation** - API documentation và user guides

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-05  
**Maintainer:** Development Team
