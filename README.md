# CNPM_NC

## Backend Integration Status

FE gọi backend gộp (CNPM-BE nhánh `feat/merge-a-b`, bản 2.0.0) qua
`src/api/axiosClient.js`. Vite proxy `/api` và `/ws` tới `http://localhost:8000`
và bỏ tiền tố `/api`. Backend phải có `http://localhost:5173` trong
`CORS_ORIGINS` (WebSocket kiểm tra Origin). Contract đầy đủ: `docs/API.md` của backend.

| Phần | Trạng thái |
| --- | --- |
| Đăng ký/đăng nhập | Email + `full_name`; lưu `access_token`/`refresh_token`. Gặp 401 thì tự gọi `/auth/refresh` một lần rồi gửi lại request. |
| Phòng học | `/meetings` (tạo, join bằng mã, leave, end, lịch sử). Một giáo viên, nhiều học viên. Gửi `mode` và `participant_mode` khi tạo phòng. |
| Thoát trang | `pagehide` gọi `/meetings/{id}/disconnect`; mở lại phòng thì backend tự join lại, nên refresh không làm mất chỗ. |
| Realtime | WebSocket `/ws/meetings/{id}` với `AUTH` + JWT; học viên gửi `FRAME` (`frame_base64`). |
| Ghi hình, báo cáo | `POST /meetings/{id}/recordings` (raw video), `/recordings/{id}/status`, `/meetings/{id}/report`. |
| Chưa có giao diện | Tài liệu chia sẻ, hồ sơ, quản trị user, media: đã có hàm trong `src/api/documentApi.js`, `src/api/userApi.js`, `src/api/meetingApi.js`. |
| Mock (MSW) | `src/mocks/` vẫn theo contract cũ (`/api/rooms`), chỉ chạy khi `VITE_USE_MOCKS=true`. |

WebSocket dùng access token lúc kết nối. Token hết hạn sau `ACCESS_MINUTES`
(mặc định 15 phút) thì backend đóng socket với `TOKEN_EXPIRED`; FE hiện chưa tự
kết nối lại, nên buổi học dài cần tăng `ACCESS_MINUTES` ở backend hoặc bổ sung reconnect.

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
