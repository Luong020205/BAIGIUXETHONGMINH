# Hệ thống Quản lý Bãi Giữ xe Thông minh (Smart Parking)

[![Deploy with Vercel](https://vercel.com/button)](https://nguyendotrungluongedu.id.vn)

## 🌐 Demo Website
Truy cập bản demo trực tuyến tại: **[https://nguyendotrungluongedu.id.vn](https://nguyendotrungluongedu.id.vn)**

## 🚀 Công nghệ sử dụng
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Recharts (Biểu đồ).
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security - RLS).
- **Trạng thái**: Context API (Auth, Toast), Custom Hooks.

## ✨ Tính năng nổi bật
- **Đa vai trò (Role-based)**: Admin, Nhân viên (Attendant), và Khách hàng.
- **Admin**: Dashboard thống kê, Quản lý khu vực, Cấu hình giá, Quản lý người dùng, Báo cáo doanh thu.
- **Nhân viên**: Nhận xe (Check-in), Trả xe & Thanh toán (Check-out), Giám sát xe trong bãi, Tra cứu lịch sử.
- **Khách hàng**: Quản lý phương tiện cá nhân, Xem lịch sử gửi xe, Theo dõi hóa đơn.
- **Giao diện**: Thiết kế Glassmorphism hiện đại, Responsive hoàn toàn trên Mobile & Desktop.

## 🛠 Hướng dẫn thiết lập

### 1. Cấu hình Supabase (Backend)
1. Truy cập [Supabase Dashboard](https://supabase.com/) và tạo project mới.
2. Mở mục **SQL Editor** và sao chép nội dung từ file `backend/supabase/schema.sql`.
3. Chạy lệnh SQL để khởi tạo các bảng, policies, và dữ liệu mẫu.

### 2. Cấu hình Frontend
1. Truy cập thư mục `frontend/`.
2. Tạo file `.env` dựa trên `.env.example`.
3. Nhập `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` từ cài đặt Supabase của bạn (Settings -> API).

### 3. Chạy ứng dụng
```bash
cd frontend
npm install
npm run dev
```
Ứng dụng sẽ chạy tại địa chỉ mặc định `http://localhost:5173`.

## 👤 Tài khoản thử nghiệm
Sau khi chạy `schema.sql`, bạn có thể tạo tài khoản qua trang Đăng ký (Register).
- Tài khoản mới đăng ký mặc định sẽ có vai trò là **Customer**.
- Để nâng cấp lên **Admin** hoặc **Staff**, hãy thay đổi cột `role` trong bảng `profiles` tại Supabase Dashboard.

## 📁 Cấu trúc thư mục
- `backend/supabase/`: Chứa file schema SQL.
- `frontend/src/components/`: Các component dùng chung và Layout.
- `frontend/src/context/`: Quản lý Auth và Toast notifications.
- `frontend/src/pages/`: Các trang theo vai trò (Admin, Employee, Customer).
- `frontend/src/utils/`: Cấu hình Supabase client và hàm helper.

---
WEBSITE DEMO PTTKHT NHÓM 1
