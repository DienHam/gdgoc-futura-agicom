from config import policy_col, product_col

# Nạp chính sách
policy_col.add(
    documents=[
        "Chính sách đổi trả: 7 ngày kể từ khi nhận hàng, yêu cầu còn nguyên tem mác.",
        "Phí vận chuyển: Freeship cho đơn hàng trên 500k, dưới 500k phí ship nội thành 30k."
    ],
    ids=["pol_001", "pol_002"]
)

# Nạp sản phẩm
product_col.add(
    documents=[
        "iPhone 15 Pro Max: Màu Titan Tự Nhiên, Titan Xanh, Titan Trắng. Giá 29tr900.",
        "Samsung S24 Ultra: Có bút S-Pen, màu Xám, Đen, Tím. Giá 26tr500."
    ],
    ids=["prod_001", "prod_002"]
)
print("Đã nạp dữ liệu mẫu thành công!")