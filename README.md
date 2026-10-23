# Neo-Learn AI Frontend

Frontend React/Vite cho lớp học trực tuyến WebRTC và luồng phân tích cảm xúc. Ứng dụng luôn sử dụng REST API và WebSocket của project `CNPM-BE`.

Các dữ liệu trình bày viết cứng trong một số dashboard vẫn được giữ để hoàn thiện giao diện. Chúng không chặn hoặc giả lập request backend.

## Công nghệ chính

- React 19 và React Router.
- Vite 8, Tailwind CSS 4 và Ant Design 6.
- Axios cho REST API.
- WebSocket cho signaling.
- WebRTC native cho camera, micro và truyền media peer-to-peer.
- MediaRecorder cho recording.
- Oxlint để kiểm tra mã nguồn.

## Yêu cầu

- Node.js 20.17 trở lên và npm.
- Backend `CNPM-BE` chạy tại `http://localhost:8000`.
- Database và các cấu hình backend đã sẵn sàng.
- Trình duyệt hỗ trợ WebRTC, MediaRecorder và quyền camera/micro.

## Cài đặt và chạy local

Trong project FE:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Frontend chạy cố định tại:

```text
http://localhost:3000
```

Backend chạy tại:

```text
http://localhost:8000
```

Nếu port `3000` đang được sử dụng, Vite sẽ báo lỗi thay vì tự đổi port để tránh lệch origin được backend cho phép.

## Cấu hình môi trường

`.env.example`:

```dotenv
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

VITE_STUN_URLS=stun:stun.l.google.com:19302
VITE_TURN_URLS=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```

Sau khi sửa biến môi trường, cần dừng và chạy lại `npm run dev`.

| Biến | Ý nghĩa |
|---|---|
| `VITE_API_URL` | Base URL REST API |
| `VITE_WS_URL` | Base URL WebSocket; nếu bỏ trống FE suy ra từ API/current origin |
| `VITE_STUN_URLS` | Danh sách STUN fallback, phân cách bằng dấu phẩy |
| `VITE_TURN_URLS` | Danh sách TURN fallback |
| `VITE_TURN_USERNAME` | Username TURN fallback |
| `VITE_TURN_CREDENTIAL` | Credential TURN fallback |

Không đặt TURN credential dài hạn trong biến `VITE_*` ở production vì các giá trị này được đóng gói công khai vào JavaScript. Production nên để backend trả ICE config.

## Scripts

```bash
npm run dev      # Chạy development server tại localhost:3000
npm run lint     # Chạy Oxlint
npm test         # Kiểm tra logic phân trang, form Admin, phân vai trò và bố cục camera
npm run build    # Tạo production build trong dist/
npm run preview  # Xem thử production build
```

## Cấu trúc project

```text
public/                      Ảnh, logo và icon tĩnh
src/
  api/
    axiosClient.js           Axios, Bearer token, refresh token và xử lý lỗi
    authApi.js               Register, login, me và logout
    adminApi.js              Danh sách Admin, quản lý người dùng và hồ sơ cá nhân
    meetingApi.js            Meeting, ICE config, history và recording
    emotionApi.js            Gửi frame và lấy emotion log
    reportApi.js             Report và trạng thái phân tích recording
    materialApi.js           Upload/list/download tài liệu

  components/                Component UI dùng lại
    admin/                   Form tài khoản/mật khẩu, hộp thoại chi tiết và UI Admin
  config/
    runtime.js               REST URL và WebSocket URL
    iceServers.js            STUN/TURN fallback và chuẩn hóa ICE server
  contexts/                  Auth provider và context
  hooks/
    useAdminResource.js      Tải dữ liệu, hủy request cũ, làm mới và xử lý lỗi Admin
    useAdminList.js          Phân trang danh sách Admin khi API không trả tổng số
    useAdminTeacherNames.js  Tra tên giáo viên cho danh sách phòng học
    useWebSocket.js          WebSocket backend và chuyển đổi signaling protocol
    useWebRTC.js             Peer connection, SDP, ICE và remote stream
  layouts/                   Auth, dashboard, lobby và meeting panels
  pages/                     Login, register, dashboard, meeting và report
    admin/                   Người dùng, phòng học và hồ sơ Admin
  styles/admin.css           Giao diện Admin, tách biệt giao diện giáo viên/học sinh
  routes/                    Route và kiểm tra quyền truy cập
  utils/
    session.js               Lưu access/refresh token và current user
    mediaSession.js          Chuyển MediaStream từ lobby sang meeting
  App.jsx                    Theme provider và app root
  main.jsx                   Khởi tạo và render React
```

## Các route giao diện

| Route | Quyền | Nội dung |
|---|---|---|
| `/login` | Công khai | Đăng nhập bằng email và mật khẩu |
| `/register` | Công khai | Đăng ký học sinh/giáo viên |
| `/teacher` | Giáo viên | Dashboard giáo viên |
| `/student` | Học sinh | Dashboard học sinh |
| `/meeting/:roomId` | Đã đăng nhập | Phòng học WebRTC |
| `/report` | Giáo viên | Báo cáo AI của meeting `after_session` |
| `/admin` | Admin | Chuyển tới danh sách người dùng |
| `/admin/users` | Admin | Xem, sửa, đổi vai trò, đặt lại mật khẩu và xóa người dùng |
| `/admin/meetings` | Admin | Xem phòng học và danh sách người tham gia |
| `/admin/profile` | Admin | Sửa hồ sơ và đổi mật khẩu tài khoản đang đăng nhập |

Route `/` chuyển tới dashboard dựa trên `user.role` do backend trả về.

## Xác thực và phiên đăng nhập

Luồng đăng nhập:

```text
POST /auth/login
→ lưu access_token và refresh_token
→ GET /auth/me
→ lưu current user
→ chuyển tới dashboard theo role
```

- Access token được gắn vào `Authorization: Bearer ...`.
- Khi REST API trả `401`, FE thử `/auth/refresh` một lần rồi gửi lại request.
- Nếu refresh thất bại, session được xoá.
- “Ghi nhớ phiên đăng nhập” sử dụng `localStorage`; nếu không chọn thì dùng `sessionStorage`.
- Đăng xuất gọi `/auth/logout` rồi xoá dữ liệu phiên phía FE.
- Backend quyết định việc đăng ký giáo viên có cần mã mời hay không.

## Quản trị hệ thống

Đăng nhập bằng tài khoản có `role: admin` do BE cấp; FE tự chuyển tới `/admin/users`. Admin dùng cùng cơ chế access/refresh token với các vai trò khác. Giáo viên/học sinh không vào được route Admin; Admin cũng không được chuyển vào phòng học hoặc báo cáo dành riêng cho giáo viên.

| Nhóm | API đang sử dụng | Chức năng |
|---|---|---|
| Người dùng | `GET /admin/users` | Danh sách có phân trang |
| Chi tiết người dùng | `GET /v1/users/{id}` | Tải thông tin mới nhất trước khi sửa |
| Cập nhật | `PUT /v1/users/{id}` | Họ tên, email, vai trò; đặt mật khẩu mới qua form riêng |
| Xóa tài khoản | `DELETE /v1/users/{id}` | Yêu cầu nhập email xác nhận; không cho tự xóa |
| Phòng học | `GET /admin/meetings` | Danh sách và chi tiết lấy từ dữ liệu danh sách |
| Tên giáo viên | `GET /v1/users/{id}` | Tra tên khi thông tin người tham gia chưa có giáo viên |
| Hồ sơ Admin | `GET/PUT /v1/users/me` | Hồ sơ cá nhân, đổi mật khẩu và đồng bộ phiên đăng nhập FE |

Danh sách hiển thị 20 mục/trang và lấy thêm 1 mục để xác định có trang sau. Tìm kiếm/lọc chỉ áp dụng **trong trang đang xem**, được ghi rõ trên giao diện; không hiển thị tổng số toàn hệ thống vì BE chưa trả trường này. Thông tin phòng là ảnh chụp tại lần tải gần nhất; dùng **Làm mới** để cập nhật.

API Admin hiện bao gồm cả phòng được xóa mềm, nhưng chưa trả cờ để phân biệt các phòng này. FE hiển thị đúng danh sách nhận được, không tự suy đoán phòng đã xóa.

Không có số liệu/demo cố định trong Admin. Các chức năng tạo tài khoản, quản lý mã mời/whitelist, khóa tài khoản, thao tác phòng học hay báo cáo tổng hệ thống chưa có API Admin tương ứng nên không có nút giả trên UI.

Lưu ý hợp đồng BE hiện tại: xóa người dùng chỉ xóa tài khoản và refresh session, không xóa phòng học/bản ghi liên quan. Hộp xác nhận giải thích việc dữ liệu cũ được giữ lại. BE chưa kiểm tra các quan hệ dữ liệu trước khi xóa. Đổi mật khẩu có hiệu lực ở lần đăng nhập tiếp theo, không có API thu hồi mọi phiên từ màn hình này.

Nếu chưa có Admin, provision bằng công cụ hiện có của BE (chạy trong thư mục `CNPM-BE`; mật khẩu được nhập tương tác):

```powershell
.\.venv\Scripts\python.exe -m scripts.create_admin --email admin@example.com --name "Quản trị viên"
```

Đăng ký giáo viên theo mã mời độc lập với Admin UI: cấu hình `ALLOW_TEACHER_REGISTRATION=false` và `TEACHER_REGISTRATION_KEY` ở BE, sau đó khởi động lại BE. Màn hình Admin không thay đổi các biến môi trường này.

Kiểm thử Admin trên trình duyệt với BE dùng dữ liệu tạm: xem [tests/README.md](tests/README.md).

## Meeting API

Đồng hồ trên thanh meeting dùng **mốc chung `created_at` của phòng từ BE**, không lưu mốc riêng theo tài khoản/trình duyệt. Teacher và student vào muộn, reconnect, F5 hay vào lại đều tính từ cùng mốc này, bao gồm thời gian mất kết nối. FE tính bằng chênh lệch thời gian thực nên tab chạy nền không làm hụt giây; nếu thiếu mốc hợp lệ thì hiển thị `--:--:--`, không tự bắt đầu một đồng hồ riêng. Áp dụng cho cả realtime và after_session, không thay đổi bộ đếm ghi hình. Hiện FE tạo phòng với `status: ongoing` nên phòng bắt đầu ngay khi tạo. BE chưa có `started_at`: nếu sau này tạo phòng trước rồi mới bắt đầu, cần bổ sung trường này để không tính cả thời gian chờ. Đồng hồ các thiết bị cần đặt đúng giờ hệ thống; FE chưa đồng bộ độ lệch đồng hồ với máy chủ.

Các endpoint FE đang sử dụng hoặc đã chuẩn bị:

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
- `mode` → `analysisMode`, giữ nguyên giá trị `realtime` / `after_session` như backend. `batch` chỉ dùng cho nguồn phân tích/báo cáo (`source`).
- `ongoing` → `active`.
- `ended` → `closed`.

Giáo viên có thể đóng phòng; giáo viên và học sinh đều có thể rời phòng riêng. Backend giữ lại meeting đã kết thúc để phục vụ history, recording và report.

## WebSocket và WebRTC

FE kết nối:

```text
WS /ws/meetings/{meetingId}
```

Protocol được hỗ trợ:

- `AUTH`, `JOIN`, `LEAVE`.
- `OFFER`, `ANSWER`, `ICE_CANDIDATE`.
- `CAMERA_STATUS`, `MIC_STATUS`.
- `MEETING_ENDED`.

FE chuyển đổi `sender_id`/`target_id` của backend sang model nội bộ, tự reconnect có giới hạn và refresh access token khi socket báo `TOKEN_EXPIRED`.

WebRTC sử dụng:

- `RTCPeerConnection` cho peer-to-peer media.
- Perfect negotiation để xử lý hai peer gửi offer đồng thời.
- `replaceTrack`/`addTrack` khi bật camera hoặc micro sau khi vào phòng.
- ICE candidate do signaling WebSocket chuyển tiếp.

## STUN/TURN

Khi vào meeting, FE gọi:

```text
GET /meetings/{meetingId}/ice-config
```

`iceServers` do backend trả về được truyền vào `RTCPeerConnection`. Nếu endpoint lỗi hoặc danh sách rỗng, FE fallback về `VITE_STUN_URLS`; mặc định là:

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

STUN thường đủ cho localhost hoặc mạng đơn giản. Môi trường NAT/firewall phức tạp cần TURN thật.

## Recording, emotion, report và tài liệu

Với phòng `realtime`, recording được gom thành `Blob` rồi tải trực tiếp về máy giáo viên; FE không upload video này lên backend.

Với phòng `after_session`, recording được upload raw video body tới:

```text
POST /meetings/{meetingId}/recordings
```

Các chức năng đã được nối vào UI:

- Giáo viên upload tài liệu; giáo viên và học sinh xem danh sách, lấy link tải trong panel meeting.
- Học sinh gửi frame realtime qua WebSocket, tự fallback REST khi socket chưa sẵn sàng.
- Giáo viên xem emotion realtime, xác suất và emotion log trong panel meeting.
- Giáo viên xem report meeting thật gồm distribution, timeline, summary và dữ liệu theo student ID.
- Chatbox của báo cáo `after_session` gửi câu hỏi tới `POST /meetings/{meetingId}/chat` và hiển thị câu trả lời từ backend. Endpoint này có trên nhánh BE `feat/merge-tu-tien`; nhánh BE đang chạy phải có endpoint đó thì chat mới hoạt động.
- Recording được upload, yêu cầu phân tích, polling trạng thái và mở playback URL trong phiên hiện tại.
- Lịch sử meeting giáo viên tự cập nhật khi recording đang được xử lý.

Các API recording metadata/analysis riêng vẫn có wrapper để mở rộng màn hình chi tiết; UI báo cáo hiện dùng report tổng hợp theo meeting.

## Dữ liệu demo được giữ lại

Các dữ liệu sau nằm trực tiếp trong component để trình bày UI và không can thiệp request backend:

- Lịch học đã lên lịch và một số nội dung thống kê trong dashboard giáo viên.
- Danh sách lớp, lịch sử và thống kê trong dashboard học sinh.

Các dữ liệu này cần được thay bằng response backend khi triển khai từng màn hình hoàn chỉnh.

## Giới hạn hiện tại

- Backend hiện giới hạn một giáo viên và một học sinh trong một meeting.
- Chat trực tiếp trong meeting hiện mới có giao diện; ô nhập và nút gửi chưa nối API/protocol backend.
- Backend không có tên/chủ đề meeting và chế độ giáo viên duyệt người tham gia.
- Report backend và route FE hiện chỉ dành cho giáo viên.
- Backend chưa có API liệt kê recording theo meeting, nên playback trong UI chỉ áp dụng cho bản ghi vừa upload trong phiên hiện tại.
- TURN infrastructure thật chưa được cấu hình trong repository.

## Production/deploy

Build:

```bash
npm run build
```

Thư mục đầu ra là `dist/`.

### FE và backend khác domain

```dotenv
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
```

Backend phải cho phép domain FE trong CORS và WebSocket origin.

### FE và backend cùng domain qua reverse proxy

```dotenv
VITE_API_URL=/api
VITE_WS_URL=wss://app.example.com
```

Reverse proxy cần:

- Chuyển `/api/*` tới REST backend và bỏ prefix `/api` nếu backend chạy route ở root.
- Chuyển `/ws/*` tới WebSocket backend và hỗ trợ header upgrade.
- Phục vụ file trong `dist/` và fallback các route SPA về `index.html`.

Camera/micro ngoài localhost yêu cầu HTTPS; WebSocket tương ứng phải dùng `wss://`.

## Kiểm tra trước khi bàn giao

```bash
npm run lint
npm run build
```

Checklist tích hợp:

- Backend chạy tại URL đã cấu hình.
- FE origin nằm trong CORS/WebSocket origin của backend.
- Login trả access/refresh token và `/auth/me` trả user có `role`.
- Tạo/join meeting trả model đúng contract.
- ICE endpoint trả cấu hình hoặc FE dùng STUN fallback.
- Hai trình duyệt trao đổi được SDP/ICE và nhận media.
- Upload recording dùng MIME được backend chấp nhận.
- Production sử dụng HTTPS/WSS và có TURN nếu cần hoạt động qua mạng hạn chế.

## Lỗi thường gặp

### `Failed to fetch`, lỗi CORS hoặc WebSocket không kết nối

- FE local phải mở bằng `http://localhost:3000`.
- Backend local phải chạy tại `http://localhost:8000`.
- Kiểm tra `VITE_API_URL` và `VITE_WS_URL`.
- Không mở một bên bằng `localhost` và bên còn lại bằng `127.0.0.1` nếu backend chỉ cho phép origin `localhost`.

### Hai người vào phòng nhưng không có hình/tiếng

- Cho phép camera và micro trên cả hai trình duyệt.
- Kiểm tra signaling WebSocket đã `connected`.
- Kiểm tra ICE config từ backend.
- Thử TURN nếu hai thiết bị ở mạng hạn chế.

### Port 3000 đã được sử dụng

Dừng process đang chiếm port. Không tự đổi port FE nếu chưa cập nhật origin được backend cho phép.
