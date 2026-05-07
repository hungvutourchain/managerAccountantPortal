# Tour Management Audit Logging System

This implementation adds comprehensive audit logging functionality to track and display user changes in the tour management system. The system tracks changes across all sections of tour data and provides a user-friendly interface to view change history.

## Features

### Frontend Features (Angular)
- **Change Tracking**: Automatically detects and logs changes when tour data is updated
- **Audit Log Viewer**: Beautiful popup interface to view change history
- **Detailed Change Information**: Shows before/after values for all changes
- **Section-based Organization**: Changes are categorized by section (General Info, Services, Passengers, Pricing, etc.)
- **User-friendly Display**: Formatted values and descriptions in English
- **Real-time Updates**: Changes are logged immediately when saves occur

### Backend Features (C# API)
- **RESTful API**: Clean endpoints for logging and retrieving audit data
- **MongoDB Storage**: Efficient storage and querying of audit logs
- **Pagination**: Handle large datasets with proper pagination
- **Filtering**: Filter logs by date, user, change type, or section
- **Statistics**: Get overview statistics about changes
- **Data Retention**: Automatic cleanup of old logs based on retention policy
- **Export Functionality**: Export audit logs to CSV format

## Frontend Implementation

### 1. Service Integration
The `ServiceAuditLogService` has been enhanced to handle tour-specific change tracking:

```typescript
// Enhanced service with tour-specific methods
logTourChanges(originalData: any, currentData: any): void
detectChanges(originalData: any, currentData: any): any[]
trackGeneralInfoChanges(original: any, current: any, changes: any[]): void
trackServiceItemChanges(original: any, current: any, changes: any[]): void
trackPassengerChanges(original: any, current: any, changes: any[]): void
trackPricingChanges(original: any, current: any, changes: any[]): void
```

### 2. Component Integration
The tour edit component now includes:

```typescript
// Change tracking properties
originalTourData: any = null;
changeTrackingEnabled: boolean = true;
changeHistory: any[] = [];

// Audit log display properties
showAuditLogs: boolean = false;
auditLogsServiceId: string = '';
auditLogsServiceName: string = '';
```

### 3. UI Components
- **Change History Button**: Styled button in the toolbar to open audit logs
- **Audit Log Popup**: Full-screen overlay with the audit log component
- **Responsive Design**: Works on desktop and mobile devices

## Backend Implementation

### 1. API Controller
`ServiceAuditLogController` provides these endpoints:

```csharp
POST /api/ServiceAuditLog/LogChange        // Log a new change
POST /api/ServiceAuditLog/GetLogs          // Get paginated logs with filtering
GET  /api/ServiceAuditLog/GetStatistics/{serviceId}  // Get change statistics
```

### 2. Service Layer
`ServiceAuditLogService` handles:
- Change logging with validation
- Efficient querying with MongoDB filters
- Automatic data cleanup
- Export functionality

### 3. Data Models
```csharp
public class ServiceAuditLog
{
    public string Id { get; set; }
    public string ServiceId { get; set; }     // Tour ID
    public string ServiceName { get; set; }   // Tour name/code
    public string UserId { get; set; }
    public string UserName { get; set; }
    public DateTime ChangeDate { get; set; }
    public string ChangeType { get; set; }    // UPDATE, CREATE, DELETE
    public string Section { get; set; }       // GENERAL_INFO, SERVICES, etc.
    public string FieldName { get; set; }
    public string OldValue { get; set; }
    public string NewValue { get; set; }
    public string Description { get; set; }   // Human-readable description
    public string Nation { get; set; }
}
```

## Setup Instructions

### Frontend Setup

1. **Install Dependencies** (if not already installed):
```bash
npm install lodash @types/lodash moment
```

2. **Update Module**: The tours module has been updated to include the `ServiceAuditLogsComponent`.

3. **Configure Environment**: Ensure the API endpoint is configured in your environment files:
```typescript
export const environment = {
  urlOperationApi: 'https://your-api-domain.com/api'
};
```

### Backend Setup

1. **Install NuGet Packages**:
```xml
<PackageReference Include="MongoDB.Driver" Version="2.19.0" />
<PackageReference Include="Microsoft.Extensions.Hosting" Version="7.0.0" />
```

2. **Configure Services** in `Program.cs` or `Startup.cs`:
```csharp
// Add audit logging services
builder.Services.AddAuditLogging(builder.Configuration);
```

3. **Update Configuration**:
```json
{
  "ConnectionStrings": {
    "MongoDB": "mongodb://localhost:27017"
  },
  "DatabaseSettings": {
    "DatabaseName": "HotelTourPortal"
  },
  "AuditLog": {
    "RetentionDays": 365
  }
}
```

4. **Create MongoDB Indexes** (optional but recommended):
```javascript
// In MongoDB shell
db.ServiceAuditLogs.createIndex({ "ServiceId": 1, "ChangeDate": -1 })
db.ServiceAuditLogs.createIndex({ "UserId": 1, "ChangeDate": -1 })
db.ServiceAuditLogs.createIndex({ "ChangeDate": -1 })
db.ServiceAuditLogs.createIndex({ "CreatedAt": 1 }, { expireAfterSeconds: 31536000 }) // 1 year TTL
```

## Usage

### Viewing Change History
1. Open any tour in the edit component
2. Click the "Change History" button in the toolbar
3. View detailed change information with before/after values
4. Filter changes by date, user, or change type
5. Export changes to CSV if needed

### Tracked Changes
The system automatically tracks changes to:

- **General Information**: Product code, booking name, status, notes, etc.
- **Service Items**: Added/removed/modified services with pricing details
- **Passenger Information**: Passenger list changes
- **Pricing**: Sell prices, buy prices, markups, exchange rates
- **Scheduling**: Start dates, end dates, duration changes

### Change Descriptions
All changes include human-readable descriptions in English:
- "Product Code changed from 'OLD001' to 'NEW001'"
- "Added service: Airport Transfer (Qty: 2, Price: 50)"
- "Passenger count changed from 4 to 6"
- "Total Sell Price changed from '1,200.00' to '1,350.00'"

## Security Considerations

1. **Access Control**: Ensure only authorized users can view audit logs
2. **Data Privacy**: Consider masking sensitive information in logs
3. **Retention Policy**: Implement appropriate data retention policies
4. **API Security**: Secure the audit log endpoints with authentication

## Performance Considerations

1. **Async Operations**: All logging operations are asynchronous
2. **Batch Processing**: Consider batching multiple changes for better performance
3. **Database Indexing**: Proper indexes on frequently queried fields
4. **Data Archiving**: Regular cleanup of old logs to maintain performance

## Troubleshooting

### Common Issues

1. **Changes Not Being Logged**:
   - Check if `changeTrackingEnabled` is true
   - Verify the audit log service is properly injected
   - Check API connectivity and endpoints

2. **Performance Issues**:
   - Check database indexes
   - Implement data pagination
   - Consider reducing the change detection frequency

3. **Display Issues**:
   - Verify the audit log component is properly imported
   - Check CSS styles are loading correctly
   - Ensure responsive design is working

## Future Enhancements

1. **Real-time Notifications**: WebSocket integration for real-time change notifications
2. **Change Approval Workflow**: Require approval for certain types of changes
3. **Advanced Filtering**: More sophisticated filtering and search capabilities
4. **Dashboard Analytics**: Visual charts and analytics for change patterns
5. **Integration with External Systems**: Sync with external audit systems
6. **Mobile App**: Dedicated mobile interface for viewing changes

This implementation provides a comprehensive audit trail system that helps maintain data integrity and provides transparency into all changes made to tour information.
