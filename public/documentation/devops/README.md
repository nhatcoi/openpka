# DevOps

Hướng dẫn vận hành và triển khai hệ thống OpenAcademix.

## Docker Compose

Hệ thống hỗ trợ chạy bằng Docker Compose.

### Khởi chạy
```bash
docker-compose up -d
```

### Dừng hệ thống
```bash
docker-compose down
```

### Xem logs
```bash
docker-compose logs -f
```

## CI/CD Pipeline

### GitHub Actions
Workflow tự động:
- Lint và test code
- Build Docker image
- Deploy lên staging/production

### Build Script
```bash
./docker-build.sh
```

## Cloud Architecture

### AWS Deployment
- **Compute**: AWS Fargate (ECS)
- **Load Balancer**: Application Load Balancer (ALB)
- **Database**: RDS PostgreSQL
- **Storage**: S3 cho file uploads
- **IAM**: Role-based access control

### Environment Variables
Xem file `.env.example` để biết các biến môi trường cần thiết.

## Logging & Monitoring

### Logging
- Application logs: CloudWatch Logs
- Error tracking: Sentry (optional)

### Monitoring
- Application metrics: CloudWatch Metrics
- Database monitoring: RDS Performance Insights
- Uptime monitoring: CloudWatch Alarms

## Backup & Recovery

### Database Backup
- Automated daily backups
- Retention: 30 days
- Point-in-time recovery available

### File Backup
- S3 versioning enabled
- Cross-region replication (optional)

