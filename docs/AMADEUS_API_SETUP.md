# Hướng dẫn cấu hình Amadeus Flight API

## ✅ Hoàn thành

- ✅ Đã chuyển từ FlightRadar24 sang Amadeus Flight Offers Search API
- ✅ Đã tạo `AmadeusFlightService` với OAuth2 authentication
- ✅ Đã update UI component để sử dụng Amadeus
- ✅ Đã xóa hết code FlightRadar24 cũ
- ✅ Đã cấu hình sử dụng environment variables (không còn hardcode credentials)
- ✅ **FIX: Đã bypass AuthInterceptor để tránh conflict với Amadeus OAuth**
- ✅ Code compile không lỗi

## 🔧 Fix quan trọng: AuthInterceptor Bypass

**Vấn đề**: AuthInterceptor tự động thêm token hệ thống vào **MỌI** HTTP request, kể cả request OAuth tới Amadeus → Amadeus từ chối vì token không hợp lệ.

**Giải pháp**: Sử dụng `HttpContext` để skip interceptor cho Amadeus requests:

```typescript
// amadeus-flight.service.ts
export const SKIP_AUTH_INTERCEPTOR = new HttpContextToken<boolean>(() => false);

// Trong mỗi HTTP request tới Amadeus
const context = new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true);
this.http.post(url, body, { headers, context }) // ← Thêm context
```

```typescript
// auth.interceptor.ts  
intercept(req: HttpRequest<any>, next: HttpHandler) {
  // Check if should skip
  if (req.context.get(SKIP_AUTH_INTERCEPTOR)) {
    return next.handle(req); // ← Không thêm Authorization header
  }
  // ... existing auth logic
}
```

## ⚠️ Cần hoàn thiện: Cấu hình API Credentials

### Bước 1: Đăng ký tài khoản Amadeus

1. Truy cập [Amadeus for Developers](https://developers.amadeus.com/)
2. Click **"Register"** hoặc **"Sign up"**
3. Điền thông tin:
   - Email
   - Company name
   - Full name
   - Password
4. Xác nhận email

### Bước 2: Tạo App và lấy API Credentials

1. Sau khi đăng nhập, vào **"My Self-Service Workspace"**
2. Click **"Create new app"**
3. Điền thông tin app:
   - App name: `HotelTourPortal Flight Search`
   - App type: `Flight`
4. Click **"Create"**
5. Bạn sẽ thấy:
   - **API Key**: Chuỗi ký tự dài (ví dụ: `AbCdEf123456...`)
   - **API Secret**: Click "Show" để hiển thị (ví dụ: `XyZ789aBcD...`)

### Bước 3: Cập nhật credentials vào Environment Files

#### Development Environment

Mở file: `/src/environments/environment.ts`

Tìm section `amadeus`:

```typescript
amadeus: {
  apiKey: "YOUR_AMADEUS_API_KEY_HERE",      // Paste API Key từ Amadeus portal
  apiSecret: "YOUR_AMADEUS_API_SECRET_HERE", // Paste API Secret từ Amadeus portal
  baseUrl: "https://test.api.amadeus.com",   // Test environment
},
```

#### Production Environment  

Mở file: `/src/environments/environment.prodadmin.ts`

Tìm section `amadeus`:

```typescript
amadeus: {
  apiKey: "YOUR_PRODUCTION_API_KEY",         // Production API Key
  apiSecret: "YOUR_PRODUCTION_API_SECRET",   // Production API Secret
  baseUrl: "https://api.amadeus.com",        // Production endpoint
},
```

**⚠️ QUAN TRỌNG - Security Best Practices**:

- ❌ **KHÔNG** commit API credentials vào Git
- ✅ Thêm vào `.gitignore`: `src/environments/environment*.ts`
- ✅ Trong production, nên sử dụng **backend proxy** để bảo mật credentials
- ✅ Hoặc dùng **environment variables** từ CI/CD pipeline

### Bước 4: Test API

Sau khi config xong:

1. Rebuild ứng dụng:
   ```bash
   npm run build
   # hoặc
   ng serve
   ```

2. Mở component FlightRadar trong ứng dụng
3. Nhập airports filter: `HAN,SGN` (Hà Nội → Sài Gòn)
4. Click **"Apply Filters & Search"**
5. Kiểm tra browser console:
   - `🔐 Fetching Amadeus OAuth token...`
   - `✅ Amadeus OAuth token obtained`
   - `🔍 Searching Amadeus flights: {...}`
   - `📦 Received X flight offers from Amadeus`
   - `✅ Successfully loaded X flights from Amadeus`

### Bước 5: Troubleshooting

#### Lỗi "Amadeus API credentials not configured"

```
❌ Amadeus API credentials not configured!
Please update environment.ts with your Amadeus API Key and Secret
Get credentials from: https://developers.amadeus.com/
```

**Giải pháp**: 
- Kiểm tra file `environment.ts` đã có `apiKey` và `apiSecret` chưa
- Kiểm tra không để trống `""` 
- Rebuild lại ứng dụng sau khi thay đổi environment

#### Lỗi 401 Unauthorized

**Nguyên nhân**:
- API Key hoặc Secret sai
- App chưa được activate ở Amadeus portal
- Credentials đã hết hạn

**Giải pháp**:
- Kiểm tra API Key và Secret đúng chưa (copy/paste cẩn thận)
- Vào Amadeus portal kiểm tra app status
- Thử regenerate credentials

#### Lỗi 400 Bad Request

**Nguyên nhân**:
- Search parameters không hợp lệ
- Airport codes sai format
- Departure date sai format

**Giải pháp**:
- Kiểm tra airport codes phải là IATA 3 chữ (HAN, SGN, LHR, JFK...)
- Format ngày: `YYYY-MM-DD`
- Origin và destination phải khác nhau

#### Lỗi CORS

**Lưu ý**: Amadeus Test API (`test.api.amadeus.com`) hỗ trợ CORS từ browser

**Nếu vẫn lỗi**:
- Kiểm tra đang dùng đúng `baseUrl` chưa
- Cân nhắc tạo backend proxy cho production

#### Không có kết quả

**Nguyên nhân**:
- Không có chuyến bay nào cho route đó
- Departure date quá gần (< 1 ngày) hoặc quá xa (> 365 ngày)
- Airline filter quá strict

**Giải pháp**:
- Thử route phổ biến: `HAN,SGN`, `HAN,BKK`, `SGN,SIN`
- Thử departure date 7-30 ngày sau
- Bỏ airline filter để thấy tất cả hãng
- Check console logs để xem response từ API

## 📚 Tài liệu tham khảo

- [Amadeus Flight Offers Search API](https://developers.amadeus.com/self-service/category/air/api-doc/flight-offers-search)
- [Amadeus Authentication](https://developers.amadeus.com/self-service/apis-docs/guides/authorization-262)
- [API Test Endpoints](https://test.api.amadeus.com)

## 🔧 Code Structure

```
FlightRadar.view.ts
├── loadAvailableFlights()          → Main entry point
├── buildAmadeusSearchParams()      → Build search params
└── transformAmadeusOffers()        → Transform API response

amadeus-flight.service.ts
├── getAccessToken()                → OAuth2 authentication
├── searchFlightOffers()            → Call Flight Offers API
└── buildQueryParams()              → Build query string
```

## ⚡ Next Steps

1. **Get API Secret** từ Amadeus portal
2. **Update** vào `amadeus-flight.service.ts`
3. **Test** bằng cách search flights
4. **Optional**: Move credentials to environment variables
5. **Optional**: Create backend proxy cho production security
