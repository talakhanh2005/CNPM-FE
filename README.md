# CNPM_NC

## Backend Integration Status

The frontend is connected to the backend through `src/api/axiosClient.js`, but
the current frontend implementation is not yet compatible with the live BE
contract. The UI is partly built around mock data and a mock realtime socket.

### Compatibility Summary

| Area | Status | Finding |
| --- | --- | --- |
| API base URL | Partial | Axios uses `/api`; Vite must proxy this to `http://localhost:8000`. |
| Registration | Not compatible | FE sends `username`; BE requires `email`, `full_name`, `password`, and `role`. |
| Login | Not compatible | FE sends `username` and expects `token`; BE requires `email` and returns `access_token`. |
| Session token | Not compatible | FE stores `response.data.token`; BE returns `response.data.access_token`. |
| Create room | Not compatible | FE calls `POST /rooms`; BE exposes `POST /meetings`. |
| Load room | Not compatible | FE calls `/rooms/{id}`; BE exposes `/meetings/{meeting_id}`. |
| Join room | Not compatible | FE calls `POST /rooms/join`; BE exposes `POST /meetings/join` or `/meetings/{id}/join`. |
| Leave room | Not compatible | FE calls `/rooms/{id}/leave`; BE exposes `/meetings/{meeting_id}/leave`. |
| Meeting history | Not compatible | FE calls `/meetings/history`; BE uses `GET /meetings`. |
| Recording | Not compatible | FE posts JSON to `/recording`; BE expects video bytes at `/recordings` and creates analysis jobs. |
| Realtime socket | Not compatible | FE uses `MockRealtimeSocket`, lowercase `auth`, and `userId`; BE requires a real WebSocket, `AUTH`, and JWT token. |
| Emotion frames | Missing | FE does not capture a video frame or send `frame_base64` to the BE. |
| Emotion reports | Missing | `src/api/reportApi.js` is empty; report page has no live report API integration. |

The backend routes and payloads are authoritative. The frontend should be
updated before it is used against the live services.

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
