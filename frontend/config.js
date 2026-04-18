/* ======================================================================
   AGICOM — CẤU HÌNH KẾT NỐI BACKEND
   ======================================================================
   Đây là file DUY NHẤT bạn cần chỉnh sửa khi deploy lên Netlify/Render.

   1. Đổi giá trị AGICOM_BACKEND_URL thành URL Render của bạn:
      Ví dụ: 'https://agicom-backend.onrender.com'

   2. File này phải được load TRƯỚC api_integration.js trong index.html
      (đã được cấu hình sẵn trong index.html)
   ====================================================================== */

(function () {
  // ── ĐỔI URL NÀY THÀNH BACKEND RENDER CỦA BẠN ──────────────────────────
  var AGICOM_BACKEND_URL = 'https://agicom-backend.onrender.com';
  // ─────────────────────────────────────────────────────────────────────────

  // Ghi đè giá trị mặc định trong api_integration.js
  window.AGICOM_API_BASE = AGICOM_BACKEND_URL;

  // Cho phép override qua URL query string để test local:
  // Ví dụ: https://your-site.netlify.app/?local=1 → dùng localhost:8000
  try {
    var params = new URLSearchParams(window.location.search);
    if (params.get('local') === '1' || params.get('localhost') === '1') {
      window.AGICOM_API_BASE = 'http://localhost:8000';
      console.info('[Agicom Config] Override: dùng localhost:8000 (query ?local=1)');
    }
  } catch (_e) {}

  console.info('[Agicom Config] Backend URL:', window.AGICOM_API_BASE);
})();
