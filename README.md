# 9.27 CLASS HUB — V2

Bản V2 có thêm trang Admin để cập nhật bài tập, điểm, vi phạm và trực nhật.

## Chạy ngay
Mở `index.html`.

## Admin
Mở `admingay.html`.
Mật khẩu demo: `927admin`.

## Quan trọng
Đây vẫn là website tĩnh chạy trên GitHub Pages. Admin ở V2 dùng `localStorage`, nên:
- dữ liệu lưu trên trình duyệt/thiết bị hiện tại;
- không tự đồng bộ sang điện thoại của các bạn khác;
- mật khẩu trong JavaScript không phải bảo mật thật.

Nếu muốn lớp có **một dữ liệu chung** cho tất cả mọi người, bước tiếp theo là nối Firebase/Supabase hoặc backend riêng.


## Sơ đồ chỗ ngồi online
Chạy `supabase-seat-plan.sql` một lần sau `supabase-setup.sql` để tạo bảng `seat_assignments` và nhập sơ đồ 6x8 hiện tại. Admin sau đó có thể sắp xếp lại chỗ ngồi và lưu online.
