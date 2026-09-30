# Neo-Learn AI Frontend

Frontend lớp học trực tuyến có WebRTC và hỗ trợ luồng phân tích cảm xúc. Project được viết bằng React + Vite, có hai chế độ chạy:

- **Mock local:** chạy độc lập, không cần backend hoặc database.
- **Backend thật:** gọi REST API và WebSocket của project `CNPM-BE`.

## Công nghệ chính

- React 19 và React Router 6.
- Vite 8, Tailwind CSS 4 và Ant Design 6.
- Axios cho REST API.
- WebRTC native cho camera, micro và truyền media peer-to-peer.
- WebSocket cho signaling khi kết nối backend thật.
- MSW và `BroadcastChannel` cho REST/realtime mock local.
- Oxlint để kiểm tra mã nguồn.

## Yêu cầu môi trường

- Node.js 20.17 trở lên.
- npm đi kèm Node.js.
- Trình duyệt hỗ trợ WebRTC, MediaRecorder và quyền camera/micro.
- Backend chỉ cần thiết khi chạy chế độ backend thật.

## Cài đặt

```bash
npm install
```

Vite được cấu hình chạy cố định tại:

```text
http://localhost:3000
```

Nếu port `3000` đang được sử dụng, Vite sẽ báo lỗi thay vì tự chuyển port để tránh lệch CORS với backend.

## Chạy bằng mock — mặc định

Chạy:

```bash
npm run dev
```

Khi không có `.env.local`, development tự bật MSW:

```text
VITE_ENABLE_MOCKS chưa khai báo + chế độ development = mock được bật
```

Ở chế độ này:

- Không cần chạy backend.
- REST request `/api/*` được MSW xử lý trong trình duyệt.
- Signaling phòng họp dùng `MockRealtimeSocket` và `BroadcastChannel`.
- Dữ liệu tài khoản/phòng mock được lưu trong `localStorage`.
- Cần đăng ký một tài khoản mock trước rồi mới đăng nhập.
- Có thể mở hai tab trình duyệt để thử luồng giáo viên và học sinh.

Muốn xoá toàn bộ dữ liệu mock, xóa site data/local storage của `localhost:3000`, đặc biệt key `cnpm-msw-store`.

## Chạy với backend thật

Backend mặc định chạy tại `http://localhost:8000`; frontend vẫn chạy tại `http://localhost:3000`.

Tạo file `.env.local` ở thư mục gốc của FE:

```dotenv
VITE_ENABLE_MOCKS=false
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

Sau đó:

1. Khởi động backend tại port `8000` theo README của `CNPM-BE`.
2. Khởi động frontend:

   ```bash
   npm run dev
   ```

3. Mở `http://localhost:3000`.
4. Đăng ký tài khoản hoặc đăng nhập bằng dữ liệu đang có trong database backend.

Không dùng đồng thời port `8000` cho Vite và backend. `VITE_API_URL=http://localhost:8000` chỉ có nghĩa frontend gửi request tới backend ở port `8000`.

Backend hiện cho phép origin `http://localhost:3000`, vì vậy FE không cần thay đổi CORS của backend.

## Quy tắc bật/tắt mock

| Môi trường | `VITE_ENABLE_MOCKS` | Kết quả |
|---|---:|---|
| Development | Không khai báo | Bật mock |
| Development | `true` | Bật mock |
| Development | `false` | Gọi backend thật |
| Production build | Không khai báo | Tắt mock |
| Production build | `true` | Bật mock có chủ đích |
| Production build | `false` | Tắt mock |

Sau mỗi lần sửa `.env.local`, cần dừng và chạy lại `npm run dev`.

## Biến môi trường

Xem cấu hình mẫu đầy đủ trong `.env.example`.

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `VITE_ENABLE_MOCKS` | Tự xác định theo môi trường | Bật hoặc tắt MSW/realtime mock |
| `VITE_API_URL` | `/api` | Base URL REST API |
| `VITE_WS_URL` | Suy ra từ API/current origin | Base URL WebSocket |
| `VITE_STUN_URLS` | Google STUN | Danh sách STUN fallback, phân cách bằng dấu phẩy |
| `VITE_TURN_URLS` | Trống | Danh sách TURN fallback |
| `VITE_TURN_USERNAME` | Trống | Username TURN fallback |
| `VITE_TURN_CREDENTIAL` | Trống | Credential TURN fallback |

Không đặt TURN credential dài hạn trong biến `VITE_*` ở production vì các giá trị này được đóng gói công khai vào JavaScript của FE. 

## Scripts

```bash
npm run dev      # Chạy development server tại localhost:3000
npm run build    # Tạo production build trong dist/
npm run preview  # Xem thử production build
npm run lint     # Chạy Oxlint
```

## Cấu trúc project

```text
public/
  mockServiceWorker.js       Service Worker của MSW
  *.png                      Logo, icon và ảnh tĩnh

src/
  api/
    axiosClient.js           Axios, Bearer token, refresh token và xử lý lỗi
    authApi.js               Register, login, me và logout
    meetingApi.js            Meeting, ICE config, history và recording
    emotionApi.js            Gửi frame và lấy emotion log
    reportApi.js             Report và trạng thái phân tích recording
    materialApi.js           Upload/list/download tài liệu

  components/                Component UI dùng lại
  config/
    runtime.js               Chế độ mock, REST URL và WebSocket URL
    iceServers.js            STUN/TURN fallback và chuẩn hóa ICE server
  contexts/                  Auth provider và context
  hooks/
    useWebSocket.js          Mock/real WebSocket và chuyển đổi protocol
    useWebRTC.js             Peer connection, SDP, ICE và remote stream
  layouts/                   Auth, dashboard, lobby và meeting panels
  mocks/
    handlers.js              REST mock có envelope giống backend
    mockRealtimeSocket.js    Realtime mock giữa các tab
  pages/                     Login, register, dashboard, meeting, report
  routes/                    Route và kiểm tra quyền truy cập
  utils/
    session.js               Lưu access/refresh token và current user
    mediaSession.js          Chuyển MediaStream từ lobby sang meeting
  App.jsx                    Theme provider và app root
  main.jsx                   Khởi tạo MSW có điều kiện và render React
```

## Các route giao diện

| Route | Quyền | Nội dung |
|---|---|---|
| `/login` | Công khai | Đăng nhập bằng email và mật khẩu |
| `/register` | Công khai | Đăng ký học sinh/giáo viên |
| `/teacher` | Giáo viên | Dashboard giáo viên |
| `/student` | Học sinh | Dashboard học sinh |
| `/meeting/:roomId` | Đã đăng nhập | Phòng học WebRTC |
| `/bao-cao-cam-xuc` | Đã đăng nhập | Giao diện báo cáo cảm xúc |
| `/report` | Đã đăng nhập | Alias của trang báo cáo |

Route `/` tự chuyển về dashboard dựa trên `user.role` do backend trả về.

## Xác thực và phiên đăng nhập

Luồng backend thật:

```text
POST /auth/login
→ lưu access_token + refresh_token
→ GET /auth/me
→ lưu current user
→ chuyển tới dashboard theo role
```

- Access token được gắn vào header `Authorization: Bearer ...`.
- Nếu REST API trả `401`, FE thử `/auth/refresh` một lần rồi gửi lại request.
- Nếu refresh thất bại, session được xoá.
- Chọn “Ghi nhớ phiên đăng nhập” sẽ lưu session trong `localStorage`; nếu không chọn sẽ dùng `sessionStorage`.
- Đăng xuất gọi `/auth/logout` rồi xoá dữ liệu phiên phía FE.
- Đăng ký giáo viên có trường mã mời; backend quyết định mã có bắt buộc hay không.

## Meeting và WebRTC

Các luồng REST đã chuẩn bị theo backend:

```text
POST /meetings
POST /meetings/join
GET  /meetings/{meetingId}
POST /meetings/{meetingId}/start
POST /meetings/{meetingId}/leave
POST /meetings/{meetingId}/end
GET  /meetings
GET  /meetings/{meetingId}/ice-config
POST /meetings/{meetingId}/recordings
```

`meetingApi.js` chuyển model backend sang model UI, ví dụ:

- `teacher_id` → `hostId`.
- `student_id` → `studentId`.
- `after_session` → `batch`.
- `ongoing` → `active`.
- `ended` → `closed`.

Giáo viên có nút đóng phòng; học sinh và giáo viên đều có thể rời phòng riêng. Recording được gom thành `Blob` và upload dưới dạng raw video body với MIME của `MediaRecorder`.

### Signaling WebSocket

Khi tắt mock, FE kết nối:

```text
WS /ws/meetings/{meetingId}
```

FE hỗ trợ protocol backend gồm:

- `AUTH`, `JOIN`, `LEAVE`.
- `OFFER`, `ANSWER`, `ICE_CANDIDATE`.
- `CAMERA_STATUS`, `MIC_STATUS`.
- `MEETING_ENDED`.

FE chuyển đổi `sender_id`/`target_id` của backend sang model nội bộ, tự reconnect tối đa năm lần và refresh access token khi socket báo `TOKEN_EXPIRED`.

### STUN/TURN

Khi vào meeting, FE gọi:

```text
GET /meetings/{meetingId}/ice-config
```

Danh sách `iceServers` do backend trả về được truyền trực tiếp vào `RTCPeerConnection`. Nếu endpoint lỗi hoặc danh sách rỗng, FE fallback về `VITE_STUN_URLS`; mặc định là:

```text
stun:stun.l.google.com:19302
```

Ví dụ fallback local/staging:

```dotenv
VITE_STUN_URLS=stun:stun.example.com:3478
VITE_TURN_URLS=turn:turn.example.com:3478?transport=udp,turns:turn.example.com:5349
VITE_TURN_USERNAME=your-turn-username
VITE_TURN_CREDENTIAL=your-turn-credential
```

## API đã có wrapper nhưng UI chưa nối hoàn chỉnh

- Upload/list/download tài liệu học tập.
- Gửi frame và tải emotion log realtime.
- Lấy report meeting/recording.
- Yêu cầu phân tích lại và polling trạng thái recording.

Các wrapper nằm trong `src/api/` để dùng khi triển khai tiếp, nhưng việc có wrapper không có nghĩa các màn hình hiện đã hiển thị dữ liệu thật.

## Phần hiện còn là demo hoặc chưa có backend tương ứng

- Một số card và thống kê trong dashboard giáo viên/học sinh dùng dữ liệu mẫu.
- Trang báo cáo cảm xúc hiện vẫn có dữ liệu trình bày mẫu.
- Panel cảm xúc trong meeting chưa lấy dữ liệu AI realtime.
- Giao diện chat chưa có backend và chưa gửi tin nhắn thật.
- Backend hiện không có tên/chủ đề meeting và chế độ giáo viên duyệt người tham gia, nên form tạo phòng không gửi các thuộc tính này.
- Backend hiện giới hạn mô hình một giáo viên và một học sinh trong một meeting; giao diện camera grid đã sẵn sàng cho nhiều peer nhưng không làm thay đổi giới hạn backend.
- Report backend hiện chủ yếu dành cho giáo viên; cần chốt quyền trước khi nối trang report cho học sinh.

## Production/deploy

Build:

```bash
npm run build
```

Thư mục đầu ra là `dist/`. Production mặc định tắt mock.

Có hai kiểu triển khai:

### FE và backend khác domain

```dotenv
VITE_ENABLE_MOCKS=false
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
```

Backend phải cho phép domain FE trong CORS và WebSocket origin.

### FE và backend cùng domain qua reverse proxy

```dotenv
VITE_ENABLE_MOCKS=false
VITE_API_URL=/api
VITE_WS_URL=wss://app.example.com
```

Reverse proxy cần:

- Chuyển `/api/*` tới REST backend và bỏ prefix `/api` nếu backend chạy route ở root.
- Chuyển `/ws/*` tới WebSocket backend, đồng thời hỗ trợ header upgrade.
- Phục vụ file trong `dist/` và fallback các route SPA về `index.html`.

Camera/micro trên môi trường không phải localhost yêu cầu HTTPS. WebSocket tương ứng phải dùng `wss://`.

## Kiểm tra trước khi bàn giao

```bash
npm run lint
npm run build
```

Checklist tích hợp backend:

- Backend chạy được tại URL đã cấu hình.
- `VITE_ENABLE_MOCKS=false` và đã restart Vite.
- Login trả access/refresh token, `/auth/me` trả user có `role`.
- FE origin nằm trong CORS/WebSocket origin của backend.
- Tạo/join meeting trả model đúng contract.
- ICE endpoint trả cấu hình hoặc FE dùng STUN fallback.
- Hai trình duyệt có thể trao đổi SDP/ICE và nhận media.
- Upload recording dùng MIME được backend chấp nhận.
- Production dùng HTTPS/WSS và có TURN nếu cần hoạt động qua mạng hạn chế.

## Lỗi thường gặp

### Vẫn đăng nhập bằng mock

Kiểm tra `.env.local`:

```dotenv
VITE_ENABLE_MOCKS=false
```

Sau đó restart `npm run dev`.

### `Failed to fetch`, lỗi CORS hoặc WebSocket không kết nối

- FE local phải mở bằng `http://localhost:3000`.
- Backend local phải chạy tại `http://localhost:8000`.
- Kiểm tra `VITE_API_URL` và `VITE_WS_URL`.
- Không mở FE qua một hostname khác như `127.0.0.1` nếu backend chỉ cho phép origin `localhost`.

### Hai người vào phòng nhưng không có hình/tiếng

- Cho phép camera và micro trên cả hai trình duyệt.
- Kiểm tra signaling WebSocket đã ở trạng thái `connected`.
- Kiểm tra ICE config từ backend.
- STUN có thể đủ cho local/mạng đơn giản; môi trường NAT/firewall phức tạp cần TURN thật.

### Port 3000 đã được sử dụng

Dừng process đang chiếm port. Không tự đổi port FE nếu chưa cập nhật origin được backend cho phép.
