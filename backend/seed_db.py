from config import product_col, policy_col

# 1. Nạp dữ liệu sản phẩm A56
product_col.add(
    documents=[
        "Điện thoại Agicom A56: Cấu hình 8GB RAM, 128GB ROM. Hiện tại chỉ có 2 màu: Đen bóng và Xanh lục. Giá bán: 5.500.000đ. Lưu ý: Không có màu đỏ.",
        "Điện thoại Agicom A57: Có màu Đỏ, Trắng. Giá 6.000.000đ."
    ],
    metadatas=[{"type": "product_info"}, {"type": "product_info"}],
    ids=["a56_info", "a57_info"]
)

# 2. Nạp thêm chính sách chi tiết
policy_col.add(
    documents=[
        "Chính sách bảo hành Agicom: Bảo hành 12 tháng lỗi nguồn và màn hình. Đổi mới trong 30 ngày nếu có lỗi nhà sản xuất."
    ],
    ids=["policy_warranty"]
)

print("--- Đã nạp kiến thức về A56 vào bộ não! ---")