# Service Audit Log System - Hướng dẫn triển khai

## Tổng quan

Hệ thống Audit Log cho Service được thiết kế để theo dõi và ghi lại tất cả các thay đổi được thực hiện trên dịch vụ, bao gồm:

- Thay đổi thông tin chung của service
- Thêm/sửa/xóa periods
- Thay đổi price bands
- Cập nhật connections và surcharges

## Các thành phần chính

### 1. Frontend Components

#### ServiceAuditLogService (`service-audit-log.service.ts`)
- Service chính để giao tiếp với API backend
- Các phương thức so sánh và tạo logs
- Quản lý việc gửi batch logs

#### ServiceAuditLogsComponent (`service-audit-logs/`)
- Component hiển thị danh sách logs
- Có tính năng filter, pagination
- Export logs ra CSV

#### ServiceAuditDashboardComponent (`service-audit-dashboard/`)
- Dashboard thống kê các thay đổi
- Biểu đồ phân loại thay đổi
- Hoạt động 7 ngày qua

### 2. Backend Components

#### ServiceAuditLogController (`ServiceAuditLogController.cs`)
- API controller xử lý các request audit log
- Endpoints: LogChange, SaveBatchLogs, GetLogs, CleanupOldLogs

#### ServiceAuditLogService (`ServiceAuditLogService.cs`)
- Service implementation cho việc quản lý audit logs
- Tích hợp với MongoDB
- Background service để cleanup logs cũ

## Cài đặt và cấu hình

### 1. Frontend Setup

#### Bước 1: Thêm service vào module
```typescript
// app.module.ts hoặc shared.module.ts
import { ServiceAuditLogService } from './shared/services/service-audit-log.service';

@NgModule({
  providers: [
    ServiceAuditLogService,
    // other providers...
  ]
})
```

#### Bước 2: Thêm components vào declarations
```typescript
import { ServiceAuditLogsComponent } from './shared/components/service-audit-logs/service-audit-logs.component';
import { ServiceAuditDashboardComponent } from './shared/components/service-audit-dashboard/service-audit-dashboard.component';

@NgModule({
  declarations: [
    ServiceAuditLogsComponent,
    ServiceAuditDashboardComponent,
    // other components...
  ]
})
```

#### Bước 3: Import FormsModule cho các filter
```typescript
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    FormsModule,
    // other imports...
  ]
})
```

### 2. Backend Setup

#### Bước 1: Cài đặt packages
```xml
<!-- Trong .csproj file -->
<PackageReference Include="MongoDB.Driver" Version="2.19.0" />
<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
```

#### Bước 2: Cấu hình trong appsettings.json
```json
{
  "ConnectionStrings": {
    "MongoDB": "mongodb://localhost:27017"
  },
  "MongoDbSettings": {
    "DatabaseName": "HotelTourPortal",
    "ServiceAuditLogsCollection": "ServiceAuditLogs"
  }
}
```

#### Bước 3: Cấu hình Dependency Injection trong Startup.cs
```csharp
public void ConfigureServices(IServiceCollection services)
{
    // Thêm audit log services
    services.AddAuditLogServices(Configuration);
    
    // Thêm background service để cleanup
    services.AddHostedService<AuditLogCleanupService>();
}
```

## Cách sử dụng

### 1. Tích hợp vào OptionService Component

Audit logging đã được tích hợp vào `OptionSerivceComponent`:

```typescript
// Trong UpdateService method
if (this.originalServiceData) {
  const logs = this.auditLogService.compareAndCreateLogs(
    this.originalServiceData,
    this.sevgroup,
    this.user.userId,
    this.user.username,
    this.user.nation
  );

  if (logs.length > 0) {
    this.auditLogService.saveBatchLogs(logs).subscribe();
  }
}
```

### 2. Hiển thị Audit Logs

```html
<!-- Trong template -->
<service-audit-logs
  [serviceId]="serviceId"
  [serviceName]="serviceName"
  [visible]="showAuditLogs">
</service-audit-logs>
```

### 3. Hiển thị Dashboard

```html
<service-audit-dashboard
  [serviceId]="serviceId"
  [serviceName]="serviceName">
</service-audit-dashboard>
```

## API Endpoints

### POST /api/ServiceAuditLog/LogChange
Ghi một log thay đổi đơn lẻ

### POST /api/ServiceAuditLog/SaveBatchLogs
Ghi nhiều logs cùng lúc

### POST /api/ServiceAuditLog/GetLogs
Lấy danh sách logs với filter và pagination

### POST /api/ServiceAuditLog/CleanupOldLogs
Xóa logs cũ (được gọi tự động bằng background service)

### GET /api/ServiceAuditLog/GetServiceLogsSummary/{serviceId}
Lấy thống kê tóm tắt của service

## Cấu trúc dữ liệu

### ServiceChangeLog
```typescript
{
  _id: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  userName: string;
  changeDate: Date;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'PERIOD_ADD' | 'PERIOD_UPDATE' | 'PERIOD_DELETE';
  section: 'GENERAL_INFO' | 'PERIOD' | 'PRICE_BAND' | 'CONNECTION' | 'SURCHARGES';
  fieldName?: string;
  oldValue: any;
  newValue: any;
  description: string;
  periodId?: string;
  nation: string;
}
```

## Tính năng chính

### 1. Tự động ghi logs
- Tự động so sánh dữ liệu cũ và mới
- Ghi logs khi có thay đổi
- Batch processing để tối ưu performance

### 2. Hiển thị logs
- Filter theo user, date range, change type
- Pagination
- Export to CSV
- Detail view cho từng thay đổi

### 3. Dashboard thống kê
- Tổng số thay đổi
- Phân loại theo type
- Hoạt động theo thời gian
- Recent changes

### 4. Performance optimization
- Indexes trên MongoDB
- Batch logging
- Automatic cleanup của logs cũ

## Bảo mật

- Chỉ ghi logs khi user đã authenticated
- Không lưu sensitive data trong plain text
- Logs được associate với user và nation

## Monitoring

- Background service cleanup logs cũ
- Error handling và logging
- Performance monitoring qua indexes

## Mở rộng

Hệ thống có thể được mở rộng để:

1. Thêm notification khi có thay đổi quan trọng
2. Integration với external audit systems
3. Advanced analytics và reporting
4. Real-time updates với SignalR
5. Role-based access control cho việc xem logs

## Troubleshooting

### Lỗi thường gặp:

1. **MongoDB connection issues**: Kiểm tra connection string và MongoDB service
2. **Missing indexes**: Indexes sẽ được tạo tự động khi service khởi động
3. **Memory issues**: Background cleanup service sẽ xóa logs cũ theo schedule

### Debug logs:

Logs được ghi ra console cho việc debugging. Check application logs để troubleshoot issues.

## Testing

Để test hệ thống:

1. Tạo/chỉnh sửa một service
2. Kiểm tra logs trong database
3. Xem logs qua UI component
4. Test các filter và export features

## Performance Considerations

- Logs được indexed theo serviceId và changeDate
- Batch processing để giảm database calls
- Automatic cleanup để tránh database bloat
- Consider archiving strategy cho production environment

## Security Notes

- Logs không chứa password hoặc sensitive data
- Access control dựa trên user permissions
- Audit trail không thể bị xóa bởi regular users
- Consider encryption cho sensitive log data trong production
