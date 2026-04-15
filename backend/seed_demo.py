# seed_demo.py
import datetime
from database import SessionLocal, ChatLog, CoordinationTask, init_db
from config import policy_col, product_col, resolved_qa_col

def seed_everything():
    print("[*] Đang khởi tạo Database SQL...")
    init_db()
    db = SessionLocal()

    # 1. NẠP SQL DATA (Để /daily-summary có dữ liệu)
    print("[*] Đang nạp lịch sử Chat và Task điều phối...")
    
    # Giả lập các cuộc hội thoại có Insight
    logs = [
        ChatLog(
            customer_q="Màu đỏ của A56 còn hàng không?",
            ai_a="Dạ hiện tại A56 chỉ có màu Đen và Xanh ạ.",
            insight="Khách hỏi nhiều về màu Đỏ (hiện không có)",
            timestamp=datetime.datetime.now() - datetime.timedelta(hours=2)
        ),
        ChatLog(
            customer_q="Sao bên Mobile Pro bán có 5tr1 mà shop bán 5tr5?",
            ai_a="Dạ bên em cam kết hàng chính hãng và bảo hành 12 tháng ạ.",
            insight="Khách chê giá đắt so với đối thủ Mobile Pro",
            timestamp=datetime.datetime.now() - datetime.timedelta(hours=5)
        )
    ]
    
    # Giả lập các Task đang chờ Agent khác xử lý
    tasks = [
        CoordinationTask(
            target_agent="Content",
            product_id="A56",
            instruction="Cập nhật thông báo màu Đỏ sắp về hàng để giữ chân khách.",
            status="pending"
        ),
        CoordinationTask(
            target_agent="Pricing",
            product_id="A56",
            instruction="Đối thủ Mobile Pro đang ép giá xuống 5tr1, cần tính toán lại voucher.",
            status="pending"
        )
    ]

    db.add_all(logs)
    db.add_all(tasks)
    db.commit()

    # 2. NẠP VECTOR DB (Để Chat RAG trả lời thông minh)
    print("[*] Đang nạp kiến thức vào Vector DB...")

    # Kiến thức sản phẩm
    product_col.add(
        documents=[
            "Điện thoại Agicom A56: Chip Dimensity 900, RAM 8GB, Bộ nhớ 128GB. Màu: Đen, Xanh. Giá 5.500.000đ.",
            "Điện thoại Agicom A57: Bản cao cấp, RAM 12GB, Bộ nhớ 256GB. Màu: Đen, Trắng, Đỏ. Giá 7.200.000đ."
        ],
        ids=["p1", "p2"]
    )

    # Chính sách shop
    policy_col.add(
        documents=[
            "Chính sách Freeship: Miễn phí vận chuyển cho đơn hàng trên 500.000đ toàn quốc.",
            "Chính sách đổi trả: Lỗi 1 đổi 1 trong 30 ngày nếu có lỗi nhà sản xuất."
        ],
        ids=["pol1", "pol2"]
    )

    # Kinh nghiệm đã học (Resolved QA)
    resolved_qa_col.add(
        documents=[
            "Q: Shop có hỗ trợ trả góp không? A: Dạ shop có hỗ trợ trả góp 0% qua thẻ tín dụng và HD Saison ạ.",
            "Q: Thời gian giao hàng Hà Nội bao lâu? A: Dạ nội thành HN giao trong 2h qua GrabExpress hoặc 1 ngày qua GHN ạ."
        ],
        ids=["qa1", "qa2"]
    )

    db.close()
    print("[SUCCESS] Đã nạp dữ liệu Demo thành công! Bây giờ bạn có thể chạy API.")

# Thêm vào seed_demo.py

def seed_risk_data():
    db = SessionLocal()
    
    # Giả lập một case khách dọa bóc phốt
    bad_log = ChatLog(
        customer_q="Sản phẩm mới mua 2 ngày đã hỏng màn hình. Shop làm ăn kiểu gì thế? Tôi sẽ lên hội bóc phốt!",
        ai_a="Dạ shop rất tiếc về sự cố này, em đã chuyển thông tin cho quản lý để đổi mới ngay cho mình ạ.",
        insight="Khách dọa bóc phốt do lỗi màn hình A56",
        timestamp=datetime.datetime.now()
    )
    
    risk_task = CoordinationTask(
        target_agent="RiskManager",
        product_id="A56",
        instruction="NGUY CƠ KHỦNG HOẢNG (Pháp lý/Phốt): Khách dọa bóc phốt do lỗi màn hình. Cần gọi điện xin lỗi và đổi mới trong 2h!",
        status="pending"
    )
    
    db.add(bad_log)
    db.add(risk_task)
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_everything()