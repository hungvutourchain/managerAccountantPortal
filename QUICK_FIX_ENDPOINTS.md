# 🚀 QUICK FIX - Update FlightRadar24 Endpoints

## ✅ Xác định: API Key HỢP LỆ
Đã test thành công với `/api/static/airlines/afl/light`

## 🔧 Cần sửa ngay

### File: `FlightRadar.view.ts`

**Tìm dòng 2243-2257** (hoặc tìm text `api/search/live`):

```typescript
const endpoints = [
  // Search API - More likely to return flight lists
  'https://fr24api.flightradar24.com/api/search/live?query=&limit=100',
  
  // Flights by bounds (most common approach for getting multiple flights)
  'https://fr24api.flightradar24.com/api/flights?bounds=90,-90,-180,180&limit=100',
  
  // Feed endpoint (similar to public data structure)
  'https://fr24api.flightradar24.com/api/feed?bounds=90,-90,-180,180',
  
  // Live feed with various filters
  'https://fr24api.flightradar24.com/api/live?bounds=90,-90,-180,180&limit=100',
  
  // Alternative public feed (known to work but might be rate limited)
  'https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=90,-90,-180,180&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=14400&gliders=1&stats=1',
];
```

**Thay bằng:**

```typescript
const endpoints = [
  // PRIMARY: Flight positions (OFFICIAL from docs)
  'https://fr24api.flightradar24.com/api/live/flight-positions/full?bounds=90,-90,-180,180',
  'https://fr24api.flightradar24.com/api/live/flight-positions/light?bounds=90,-90,-180,180',
  
  // Flight summary
  'https://fr24api.flightradar24.com/api/live/flight-summary/full',
  'https://fr24api.flightradar24.com/api/live/flight-summary/light',
  
  // FALLBACK: Public data feed (no auth required)
  'https://fr24api.flightradar24.com/api/live/feed.js?bounds=90,-90,-180,180&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=14400&gliders=1&stats=1',
];
```

---

### ⚠️ CÓ 2 NƠI CẦN SỬA!

1. **Nơi thứ 1:** Dòng ~2243 trong hàm `tryFlightRadar24API()`
2. **Nơi thứ 2:** Dòng ~2358 trong hàm `tryAlternativeEndpoint()`

**Sửa cả 2 nơi giống nhau!**

---

## 📝 Reference từ FlightRadar24 Official Docs

Theo mẫu code chính thức từ FlightRadar24:

```javascript
// CORRECT FORMAT
GET /api/live/flight-positions/full?bounds=50.682,46.218,14.422,22.243
Headers:
  Accept: application/json
  Accept-Version: v1
  Authorization: Bearer <token>
```

**Lưu ý:** 
- Phải có `/live/` ở giữa
- Format bounds: `lat1,lat2,lon1,lon2`
- Worldwide coverage: `90,-90,-180,180`

---

## 🧪 Test sau khi sửa

1. Save file
2. Reload ứng dụng
3. Click nút "Refresh" ở Flight Data Source
4. Mở Console (F12) để xem kết quả

**Kết quả mong đợi:**

```
✅ FlightRadar24 API - OFFICIAL ENDPOINTS
🔑 Token: VALIDATED (/api/static/airlines)
📚 Using: /api/live/flight-positions/full?bounds=...
🌍 Coverage: Worldwide (90,-90,-180,180)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 ATTEMPTING API REQUEST
🔗 Endpoint: https://fr24api.flightradar24.com/api/live/flight-positions/full?bounds=90,-90,-180,180
...

📡 RESPONSE RECEIVED
Status: 200 OK  ← ✅ THÀNH CÔNG!
```

---

## 💡 Nếu vẫn lỗi

**Nếu trả về 403/401:** API subscription của bạn có thể không bao gồm live flight tracking

**Giải pháp:**
1. Check subscription tại: https://www.flightradar24.com/premium-api/pricing
2. Hoặc dùng **OpenSky Network** (FREE, không cần API key)

---

**Updated:** October 23, 2025
