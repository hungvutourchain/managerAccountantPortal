# 🔍 DEBUG HƯỚNG DẪN: Phân Tích Sự Khác Biệt acc_TotalTLs

## ❓ **VẤN ĐỀ**
- **Tour Leader individual**: $7,500.00 (625 x 12 nights)
- **Summary Table acc_TotalTLs**: $20,999.95
- **Sự khác biệt**: $13,499.95

## 🧪 **CÁCH DEBUG**

### Bước 1: Mở Browser Developer Tools
1. Trong hotel booking page, press `F12`
2. Chuyển đến **Console** tab

### Bước 2: Chạy Debug Method
```javascript
// Trong console, gõ lệnh này để debug breakdown:
window.angular?.element(document.querySelector('room-hotel-assgin'))?.scope()?.debugAccTotalTLsBreakdown();

// Hoặc nếu có reference đến component:
$0.debugAccTotalTLsBreakdown();
```

### Bước 3: Phân Tích Output

Debug method sẽ hiển thị:

#### 📊 **Component Breakdown:**
```
unit_TotalTLs (Share Room TLs): ?
sgl_TotalTLs (Single Room TLs): ?
lc_TotalTLs (Late Checkout TLs): ?
lin_TotalTLs (Late Checkin TLs): ?
OtherServiceTotallTLs: ?
```

#### 🔍 **Individual Tour Leader Data:**
```
Tour Leader 1: {
  totalPrice: 7500,
  typeof: "SGL",
  latecheckoutPrice: ?,
  latecheckinPrice: ?
}
```

#### 🎯 **Analysis Results:**
```
individualTourLeaderTotal: 7500
accTotalTLsFromSystem: 20999.95
difference: 13499.95
```

## 🚨 **CÁC NGUYÊN NHÂN CÓ THỂ**

### 1. **Multiple Hidden Tour Leader Records**
- Có thể có tour leaders cũ chưa được xóa trong `lsRoomAssigned`
- Check tất cả items có `isTourleader: true`

### 2. **Late Checkout/Checkin Charges**
- `lc_TotalTLs`: Late checkout fees for tour leaders
- `lin_TotalTLs`: Late checkin fees for tour leaders  
- Có thể đã được add nhưng không hiển thị trên UI

### 3. **Other Services for Tour Leaders**
- `OtherServiceTotallTLs`: Additional services dành cho tour leaders
- Ví dụ: airport transfers, special meals, etc.

### 4. **Historical Data**
- Dữ liệu cũ từ previous calculations chưa được clear
- Cache or stale state trong system

### 5. **Calculation Logic Issue**
- `getTotalPriceHotelRoomAssignment()` method có thể sum duplicate data
- Enhanced vs legacy calculation conflict

## 🔧 **KHẮC PHỤC**

### Option 1: Re-calculate Clean
```javascript
// Force clean recalculation
this.ItemHotel.acc_TotalTLs = 0;
this.ItemHotel.unit_TotalTLs = 0;
this.ItemHotel.sgl_TotalTLs = 0;
this.ItemHotel.lc_TotalTLs = 0;
this.ItemHotel.lin_TotalTLs = 0;
this.ItemHotel.OtherServiceTotallTLs = 0;

// Re-run calculation
this.afac.getTotalPriceHotelRoomAssignment(this.ItemHotel);
```

### Option 2: Clean Tour Leader Data
```javascript
// Remove duplicate or invalid tour leader records
this.ItemHotel.lsRoomAssigned = this.ItemHotel.lsRoomAssigned.filter((item, index, self) => {
  if (item.isTourleader) {
    // Keep only unique tour leaders
    return self.findIndex(x => x.isTourleader && x.id === item.id) === index;
  }
  return true;
});
```

### Option 3: Manual Fix
```javascript
// Set correct acc_TotalTLs based on actual tour leaders
const actualTourLeaders = this.ItemHotel.lsRoomAssigned.filter(x => x.isTourleader);
const correctTotal = actualTourLeaders.reduce((sum, tl) => sum + (tl.totalPrice || 0), 0);
this.ItemHotel.acc_TotalTLs = correctTotal;
```

## 📋 **VERIFICATION CHECKLIST**

- [ ] Debug method runs successfully
- [ ] Component breakdown shows correct values
- [ ] Individual tour leader count matches expected
- [ ] No duplicate tour leader records
- [ ] Late checkout/checkin charges explained
- [ ] Other services charges explained  
- [ ] Manual calculation matches system calculation
- [ ] UI displays correct total

## 🎯 **KẾT LUẬN**

Sau khi chạy debug method, sẽ xác định được:
1. **Số nào đúng**: Individual ($7,500) hay Summary ($20,999.95)  
2. **Nguyên nhân**: Hidden records, additional charges, or calculation bug
3. **Cách fix**: Clean data, recalculate, or adjust logic

**→ RUN DEBUG FIRST để xác định root cause! 🔍**