# Neo-Learn AI Frontend

Frontend React/Vite cho lớp học WebRTC và phân tích cảm xúc. Ứng dụng luôn sử dụng REST API và WebSocket của `CNPM-BE`; repo không còn service worker hoặc dữ liệu giả lập phía frontend.

## Yêu cầu

- Node.js 20.17 trở lên và npm.
- Backend `CNPM-BE` chạy tại `http://localhost:8000`.
- MongoDB và các cấu hình backend đã sẵn sàng.
- Trình duyệt có WebRTC, MediaRecorder và quyền camera/micro.

## Cài đặt và chạy

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend chạy cố định tại `http://localhost:3000`. Nếu port này bận, Vite sẽ báo lỗi để tránh lệch CORS với backend.

`.env.example`:

```dotenv
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_STUN_URLS=stun:stun.l.google.com:19302
VITE_TURN_URLS=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```

Sau khi đổi biến môi trường, cần dừng và chạy lại `npm run dev`.

## Scripts

```bash
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

## Luồng đã nối backend

### Xác thực

- Đăng ký và đăng nhập bằng email hợp lệ.
- Bearer access token được gắn tự động vào REST request.
- Khi access token hết hạn, FE dùng refresh token và gửi lại request một lần.
- Route giáo viên/học sinh được bảo vệ theo `user.role`.

### Phòng học

- Tạo, tham gia, tải lịch sử, rời và đóng phòng.
- Lấy ICE server từ `GET /meetings/{id}/ice-config`.
- WebSocket `/ws/meetings/{id}` dùng cho AUTH, presence, SDP, ICE, trạng thái thiết bị và emotion event.
- Socket bị backend thay thế với code `4001` sẽ dừng, không tự reconnect tranh chấp giữa hai tab.
- ICE candidate được chuẩn hóa đúng schema backend.

### WebRTC và ghi hình

- Camera/micro truyền peer-to-peer.
- Giáo viên ghi remote stream của học sinh, không ghi nhầm camera local của giáo viên.
- Bản ghi được upload raw body tới `POST /meetings/{id}/recordings`.

### Emotion realtime

- Khi phòng ở chế độ realtime và học sinh bật camera, FE gửi JPEG 640 px mỗi giây tới backend.
- Giáo viên nhận event `EMOTION` qua WebSocket.
- Panel hiển thị trực tiếp trường `emotion`, độ tin cậy và nhật ký gần đây.
- REST emotion log được tải định kỳ để khôi phục dữ liệu sau reconnect.

### Dashboard và báo cáo

- Dashboard giáo viên/học sinh dùng dữ liệu `GET /meetings`.
- Trang báo cáo giáo viên dùng `GET /meetings/{id}/report`.
- Phân bố, số mẫu và timeline đều lấy từ response backend.

## Chưa có contract backend

- Chat trong phòng hiện hiển thị trạng thái “chưa hỗ trợ” và không giả lập gửi tin nhắn.
- API tài liệu đã có wrapper trong `src/api/materialApi.js`, nhưng chưa có màn hình quản lý tài liệu.

## Kiểm tra trước khi bàn giao

```bash
npm run lint
npm test
npm run build
```

Sau đó kiểm thử thủ công bằng hai tài khoản khác vai trò:

1. Giáo viên tạo phòng.
2. Học sinh tham gia bằng mã phòng.
3. Hai phía bật camera và kiểm tra video remote.
4. Với phòng realtime, xác nhận emotion xuất hiện ở tile và panel giáo viên.
5. Với phòng phân tích sau, giáo viên ghi remote stream học sinh rồi kết thúc phòng.

## Production

Khi deploy khác domain:

```dotenv
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
```

Backend phải cho phép origin của frontend. Camera/micro ngoài localhost yêu cầu HTTPS và WebSocket tương ứng phải dùng WSS. STUN có thể không đủ trên NAT/firewall phức tạp; môi trường thật nên có TURN.

Không đặt credential dài hạn trong biến `VITE_*` vì các giá trị này được đóng gói công khai vào JavaScript frontend.
