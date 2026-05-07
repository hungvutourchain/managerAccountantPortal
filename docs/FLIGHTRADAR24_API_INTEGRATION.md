# FlightRadar24 API Integration

## Overview
File `FlightRadar.view.ts` đã được cập nhật để sử dụng **FlightRadar24 API** thay cho API nội bộ hiện tại.

## API Configuration

### Base URL
```
https://fr24api.flightradar24.com
```

### Authentication Token
```
0199e199-2301-7381-8044-974fef01dc75|bn1e8Hrx9EFdChpr4p9771RSPEEh4C0AL0qubWEX47b74f66
```

### API Endpoints (được thử theo thứ tự)
1. **Primary**: `/v1/search/live` - Tìm kiếm chuyến bay đang hoạt động
2. **Alternative 1**: `/api/live/flight-positions` - Vị trí chuyến bay
3. **Alternative 2**: `/api/live/flights` - Danh sách chuyến bay

## Features

### 1. **Load Flights from FlightRadar24**
- Tự động load dữ liệu khi component khởi tạo
- Thử nhiều endpoints nếu endpoint chính thất bại
- Hiển thị thông tin chi tiết trong console

### 2. **Smart Data Transformation**
Hệ thống tự động xử lý nhiều cấu trúc response khác nhau:
- Array trực tiếp
- Object với keys là flight IDs
- Nested structures (result.response.data)
- Alternative keys (flights, results, items, features)

### 3. **Comprehensive Flight Data**
Mỗi chuyến bay bao gồm:
- ✈️ Flight Number & Airline Info
- 🛫 Departure Airport (Code, Name, Terminal)
- 🛬 Arrival Airport (Code, Name, Terminal)
- ⏰ Departure & Arrival Times
- 🎫 Flight Class & Luggage Allowance
- 🌍 Route Type (International/Domestic)
- 📊 Flight Status (Active/Inactive)

### 4. **Refresh Functionality**
- Nút "Refresh Flights" để cập nhật dữ liệu mới
- Hiển thị thời gian cập nhật cuối cùng
- Ngăn chặn multiple requests đồng thời

### 5. **Error Handling**
- Retry với alternative endpoints
- Detailed error logging
- User-friendly error messages
- Fallback to empty state

## Usage

### Basic Implementation
```typescript
// Component tự động load flights khi khởi tạo
ngOnInit(): void {
  this.loadAvailableFlights();
}

// Manual refresh
refreshFlights(): void {
  this.loadAvailableFlights();
}
```

### Accessing Flight Data
```typescript
// Tất cả flights
this.availableFlights

// Filtered flights
this.filteredFlights

// Last update time
this.lastUpdateTime
this.getLastUpdateTimeFormatted() // "5 minutes ago"

// Loading state
this.isLoadingFlights
```

## Data Structure

### FlightData Interface
```typescript
interface FlightData {
  id: string;                    // Unique flight ID
  flightNumber: string;          // e.g., "VN123"
  airlineCode: string;           // IATA code e.g., "VN"
  airlineName: string;           // e.g., "Vietnam Airlines"
  fromAirportCode: string;       // IATA code e.g., "SGN"
  fromAirportName: string;       // e.g., "Tan Son Nhat"
  toAirportCode: string;         // IATA code e.g., "HAN"
  toAirportName: string;         // e.g., "Noi Bai"
  departureTime?: Date;          // ISO datetime
  arrivalTime?: Date;            // ISO datetime
  flightClass?: string;          // e.g., "Economy"
  luggageAllowance?: string;     // e.g., "23kg"
  departureTerminal?: string;    // e.g., "T1"
  arrivalTerminal?: string;      // e.g., "T2"
  routeType: string;             // "International" | "Domestic"
  flightType: string;            // "Arrival" | "Departure"
  isActive: boolean;             // Flight status
  createdDate: Date;             // Record creation
  modifiedDate?: Date;           // Last modification
  createdBy?: string;            // "FlightRadar24 API"
  modifiedBy?: string;           // "FlightRadar24 API"
}
```

## API Response Handling

### Supported Response Structures
```javascript
// Structure 1: Direct array
[{flight1}, {flight2}, ...]

// Structure 2: Nested in data
{
  data: [{flight1}, {flight2}, ...]
}

// Structure 3: Deep nested
{
  result: {
    response: {
      data: [{flight1}, {flight2}, ...]
    }
  }
}

// Structure 4: Object with flight IDs as keys
{
  "ABC123": {flight1},
  "DEF456": {flight2}
}

// Structure 5: Named collections
{
  flights: [{flight1}, {flight2}, ...],
  // or results, items, features
}
```

### Field Mapping
Hệ thống tự động map từ nhiều field names khác nhau:

| Our Field | API Field Variations |
|-----------|---------------------|
| flightNumber | flight_number, flight, callsign, identification.callsign |
| airlineCode | airline_iata, airline.iata, airline.icao, airline_icao |
| airlineName | airline_name, airline.name, operator |
| fromAirportCode | origin_airport_iata, origin.iata, origin.code, estDepartureAirport |
| toAirportCode | destination_airport_iata, destination.iata, estArrivalAirport |
| departureTime | scheduled_departure, std, dep_time, time.scheduled.departure |
| arrivalTime | scheduled_arrival, sta, arr_time, time.scheduled.arrival |

## Console Logging

### Success Messages
```
🛫 Loading flights from FlightRadar24 API...
📦 Using data array structure
📋 Processing 150 raw flight records...
✅ Successfully transformed 145 valid flights
✅ Successfully loaded 145 flights from FlightRadar24
```

### Error Messages
```
❌ Error loading flights from: [url]
⚠️ No flights found in response, trying alternative endpoint...
🔄 Trying alternative endpoint (2/3)...
❌ All FlightRadar24 API endpoints failed
```

## Validation Rules

Chỉ flights thỏa mãn các điều kiện sau mới được thêm vào:
1. ✅ Flight number không phải "N/A"
2. ✅ Departure airport code không phải "N/A"
3. ✅ Arrival airport code không phải "N/A"
4. ✅ Flight status không bị cancelled hoặc diverted

## Performance

- **Caching**: Flight data được cache trong component
- **Loading State**: Ngăn chặn multiple requests
- **Smart Retry**: Tự động thử alternative endpoints
- **Memory Efficient**: Chỉ lưu flights hợp lệ

## Security Notes

⚠️ **Important**: Token hiện được hardcode trong code. Nên:
1. Di chuyển token vào environment variables
2. Implement token rotation
3. Add token expiry handling
4. Secure token storage

## Troubleshooting

### No Flights Loaded
1. Kiểm tra console logs
2. Verify internet connection
3. Check API token validity
4. Try manual refresh

### Wrong Data Structure
- API response structure có thể thay đổi
- Kiểm tra console logs để thấy actual structure
- Update `transformFlightRadarData()` method nếu cần

### CORS Errors
- API có thể block requests từ certain domains
- Configure backend proxy nếu cần
- Contact FlightRadar24 support

## Future Enhancements

- [ ] Add caching with expiry time
- [ ] Implement search/filter by route
- [ ] Add real-time updates via WebSocket
- [ ] Save favorite flights
- [ ] Export flight data
- [ ] Add flight tracking
- [ ] Implement pagination for large datasets
- [ ] Add flight history

## Support

Để được hỗ trợ:
1. Check console logs
2. Verify API token
3. Test alternative endpoints
4. Contact FlightRadar24 API support

## References

- FlightRadar24 API Documentation: https://www.flightradar24.com/api
- Component: `src/app/modules/admin/tours/FormCalculator/moduleService/view/FlightRadar.view.ts`
