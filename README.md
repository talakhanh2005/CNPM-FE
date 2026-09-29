# CNPM_NC

## Cấu trúc project

```text
public/       Tài nguyên tĩnh và Service Worker của MSW
src/
  api/        Hàm gọi API
  components/ Component dùng lại
  contexts/   Auth state dùng chung
  hooks/      Logic React, WebRTC và realtime
  layouts/    Khung giao diện
  mocks/      MSW và mock realtime socket
  pages/      Các trang
  routes/     Khai báo route và bảo vệ route
  utils/      Tiện ích dùng chung
```

## Chạy project

```bash
npm install
npm run dev
```

## Cấu hình WebRTC

Khi mở meeting, FE gọi `GET /meetings/{meetingId}/ice-config` và dùng `iceServers` do API trả về. Mock local triển khai cùng contract này. Nếu endpoint lỗi hoặc trả danh sách rỗng, FE fallback về cấu hình trong `.env.local`; mặc định dùng STUN công khai `stun:stun.l.google.com:19302`.

```dotenv
VITE_STUN_URLS=stun:stun.example.com:3478
VITE_TURN_URLS=turn:turn.example.com:3478?transport=udp,turns:turn.example.com:5349
VITE_TURN_USERNAME=your-turn-username
VITE_TURN_CREDENTIAL=your-turn-credential
```

TURN fallback chỉ được thêm khi có đủ URL, username và credential. Biến `VITE_*` được đóng gói vào mã frontend, vì vậy chỉ dùng TURN fallback cho local/staging. Production cấu hình `ICE_SERVERS` ở backend và không đặt credential dài hạn trong FE.

`VITE_API_URL` mặc định là `/api` để MSW local tiếp tục hoạt động. Khi chuẩn bị nối backend/deploy, đặt URL API phù hợp trong file môi trường của deployment; code WebRTC không cần thay đổi.

MSW mặc định bật trong development và tắt trong production build. Có thể override bằng `VITE_ENABLE_MOCKS=true/false`. Vì vậy `npm run dev` vẫn chạy độc lập như hiện tại, còn bản deploy sẽ không vô tình chặn REST request bằng dữ liệu mock.
