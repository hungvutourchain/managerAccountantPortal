# Fix Manager Assignment Issue - Summary

## Problem Identified
Manager không thể assign users cho các thành viên do các vấn đề sau:

1. **Inconsistent Role Checking Logic**: 
   - `canManageAssignments()` sử dụng `this.user?.IsLeader`
   - `loadUsersByGroup()` sử dụng `this.user?.role?.some(r => r.code === 'Leader')`

2. **UserService Role Assignment Issue**:
   - Leader và ReservationManager roles được set `IsLeader = true` không quan tâm đến `active` flag

3. **Missing Permission Checks**:
   - Không kiểm tra quyền trước khi mở assign dialog
   - Thiếu error handling và notifications

## Changes Made

### 1. Fixed `canManageAssignments()` Method
```typescript
canManageAssignments(): boolean {
  // Check for Admin or SuperAdmin first
  if (this.user?.IsAdmin || this.user?.supperAdmin) {
    return true;
  }
  
  // Check for Leader or ReservationManager roles
  if (this.user?.IsLeader || this.user?.IsReservationLeader) {
    return true;
  }
  
  // Also check the role array for Leader/ReservationManager codes
  if (this.user?.role?.some(r => 
    (r.code === 'Leader' || r.code === 'ReservationManager') && r.active
  )) {
    return true;
  }
  
  return false;
}
```

### 2. Fixed UserService `switchRole()` Method
```typescript
case "Leader":
  user.IsReservationLeader = vl.active;
  user.IsLeader = vl.active;
  break;
case "ReservationManager":
  user.IsReservationLeader = vl.active;
  user.IsLeader = vl.active;
  break;
```

### 3. Enhanced `loadUsersByGroup()` Method
- Sử dụng logic kiểm tra role nhất quán
- Thêm nation parameter vào API calls
- Cải thiện error handling

### 4. Improved `getUserGroup()` Method
- Thêm permission check
- Thêm nation parameter
- Cải thiện error handling và logging

### 5. Enhanced `openAssignDialog_assgin()` Method
- Thêm permission check trước khi mở dialog
- Thêm debug logging
- Load users từ nhiều nguồn

### 6. Improved `assignSelectedUsers()` and `removeAssignee()` Methods
- Thêm permission checks
- Cải thiện notifications với chi tiết
- Thêm form control updates

### 7. Added Debug Logging
- User initialization logging trong `ngOnInit()`
- Permission debugging trong assign dialog
- Detailed error messages

## Testing

Sử dụng file `test-manager-permissions.js` để test logic permissions:

```javascript
// Chạy trong browser console
testManagerPermissions();
```

## Files Modified

1. `/hotelTourPortal/src/app/modules/admin/dashboard/components/card-detail-dialog/card-detail-dialog.component.ts`
2. `/hotelTourPortal/src/app/core/user/user.service.ts`

## Expected Result

Sau khi fix:
- Manager (Leader/ReservationManager) có thể assign users
- Admin và SuperAdmin có thể assign users 
- Regular users không thể assign users
- Proper error messages và notifications
- Improved debugging capabilities

## Verification Steps

1. Login với Manager account
2. Open card detail dialog
3. Click "Assign Users" button
4. Verify dialog opens và shows available users
5. Select users và click "Assign Selected"
6. Verify users được assigned successfully
7. Check console logs cho debugging information
