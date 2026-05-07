# 🚀 Hướng dẫn sử dụng Tour Leader Management UI/UX

## 📍 Vị trí tích hợp

Giải pháp Tour Leader Management đã được tích hợp vào:
- **File**: `/src/app/modules/admin/tours/edit/components/roomHotelAssgin/roomHotelAssgin.component.html`
- **Vị trí**: Trong bảng Room Assignment, phần Tour Leader section

## 🎯 Các tính năng đã thêm

### 1. **Enhanced Tour Leader Header**
- Header với màu gradient (#667eea)
- Hiển thị số lượng tour leader hiện tại
- Quick action buttons: Add, Quick Actions, Bulk Edit

### 2. **Tour Leader Table Row Component**
- Component riêng biệt cho mỗi dòng tour leader
- Inline price editor cho share room và single room
- Visual indicators cho room type và FOC status
- Expandable details với room configuration

### 3. **Tour Leader Quick Actions Panel**
- Floating panel ở góc phải màn hình
- Counter để tăng/giảm số tour leader
- Inline price editor với currency support
- Quick actions: Apply to All, Copy from Hotel

### 4. **Inline Price Editor**
- Edit giá trực tiếp trên table
- Hỗ trợ cả Share Room và Single Room pricing
- Auto-save với validation
- Visual feedback khi editing

## 🎮 Cách sử dụng

### **Thêm Tour Leader mới:**
1. Click button "Add New Tour Leader" trong header
2. Hoặc sử dụng Quick Actions panel
3. Tự động tạo với default pricing từ hotel

### **Chỉnh sửa giá:**
1. **Inline editing**: Click trực tiếp vào price display
2. **Quick Actions**: Mở panel và chọn pricing mode
3. **Bulk edit**: Select multiple và apply changes

### **Copy pricing:**
1. Sử dụng "Copy from Hotel" để lấy giá base
2. Apply markup percentage nếu cần
3. Set FOC (Free of Charge) nếu miễn phí

### **Quản lý room configuration:**
1. Click vào tour leader row để expand details
2. Cấu hình room number, bed type, room status
3. Thêm special notes và services

## 🔧 Cấu hình và Custom

### **Thay đổi default behavior:**
```typescript
// In roomHotelAssgin.component.ts

// Customize default tour leader creation
NewTourLeader() {
  // Your custom logic here
  const defaultPrice = this.ItemHotel?.shareroom || 0;
  // ...existing code
}

// Customize price calculation
private recalculateHotelTotals() {
  // Your custom calculation logic
}
```

### **Custom styling:**
```scss
// In roomHotelAssgin.component.scss

// Customize tour leader header colors
.tour-leader-header {
  background: your-custom-gradient;
}

// Customize price display
.price-display {
  // Your custom styles
}
```

## 📱 Responsive Design

### **Desktop (>992px):**
- Full feature set với tất cả buttons
- Expandable details trong table
- Side floating panel

### **Tablet (768px - 992px):**
- Collapsible header actions
- Simplified inline editor
- Adjusted spacing

### **Mobile (<768px):**
- Stacked header layout
- Bottom sheet cho quick actions
- Touch-friendly buttons (44px minimum)

## ⚡ Performance Notes

### **Optimizations đã implement:**
- Debounced price updates (300ms)
- Optimistic UI updates
- Virtual scrolling cho large lists
- Lazy loading cho expandable details

### **Memory management:**
- Component destruction cleanup
- Event listener removal
- Subscription management

## 🐛 Troubleshooting

### **Lỗi thường gặp:**

1. **Component không hiển thị:**
   - Kiểm tra import trong `tours.module.ts`
   - Verify component selector đúng

2. **Price updates không save:**
   - Kiểm tra `canChangeTour` permission
   - Verify event emission chain

3. **Styling bị conflict:**
   - Check CSS specificity
   - Verify SCSS compilation

### **Debug mode:**
```typescript
// Enable debug logging
localStorage.setItem('tourLeaderDebug', 'true');

// Check in browser console
console.log('Tour Leader Debug enabled');
```

## 🔄 Integration với existing code

### **Event flow:**
1. User action → Component event
2. Component → Parent component method
3. Parent → API call/Data update
4. Update → UI refresh

### **Data flow:**
```
ItemHotel.lsRoomAssigned
├── Regular rooms (isTourleader: false)
└── Tour leaders (isTourleader: true)
    ├── sharePrice
    ├── singlePrice
    ├── foc
    └── roomStatus
```

## 📊 Analytics & Monitoring

### **Usage metrics:**
- Click rates trên quick actions
- Time to complete tasks
- Error rates

### **Performance metrics:**
- Component render time
- Price calculation duration
- Memory usage

## 🚀 Future Enhancements

### **Planned features:**
- AI-powered price suggestions
- Batch import/export
- Template-based creation
- Real-time collaboration

### **API integrations:**
- External booking systems
- Payment gateways
- Reporting services

---

## 📞 Support

Nếu gặp vấn đề với Tour Leader Management:

1. Check console errors
2. Verify permissions
3. Test với simple scenarios trước
4. Contact development team

**Happy tour managing! 🎉**
