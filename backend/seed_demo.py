import datetime
import hashlib
import json
from database import SessionLocal, ChatLog, CoordinationTask, ChatMessage, ReviewLog, ContentSuggestion, init_db
from config import policy_col, product_col, resolved_qa_col, chroma_client

def clear_data(db):
    print("[1/5] Đang dọn dẹp dữ liệu cũ...")
    # Xóa SQL
    db.query(ChatMessage).delete()
    db.query(ChatLog).delete()
    db.query(CoordinationTask).delete()
    db.query(ReviewLog).delete()
    db.query(ContentSuggestion).delete()
    db.commit()

    # Xóa Vector DB
    for col_name in ["policy_db", "product_db", "resolved_qa_db"]:
        try:
            chroma_client.delete_collection(col_name)
        except:
            pass
    
    # Khởi tạo lại collections
    policy_col = chroma_client.get_or_create_collection(name="policy_db")
    product_col = chroma_client.get_or_create_collection(name="product_db")
    resolved_qa_col = chroma_client.get_or_create_collection(name="resolved_qa_db")
    return policy_col, product_col, resolved_qa_col

def seed_vector_db(policy_col, product_col, resolved_qa_col):
    print("[2/5] Đang nạp kiến thức vào Vector DB (RAG)...")

    # 1. Kiến thức Sản phẩm (Chi tiết để AI tư vấn kỹ thuật)
    products = [
        "Samsung Galaxy S24 Ultra: Màn hình 6.8 inch Dynamic AMOLED 2X, Chip Snapdragon 8 Gen 3, RAM 12GB, Camera 200MP, Pin 5000mAh, Sạc nhanh 45W. Có bút S-Pen. Màu: Đen, Xám, Tím, Vàng.",
        "iPhone 15 Pro Max: Khung Titan, Chip A17 Pro, Camera 48MP zoom quang 5x, Màn hình ProMotion 120Hz, Cổng USB-C. Màu: Titan Tự Nhiên, Xanh, Trắng, Đen.",
        "Cáp sạc Anker 100W: Dây bọc dù bền bỉ, hỗ trợ chuẩn PD (Power Delivery), độ dài 1.8m, chip E-Marker quản lý dòng điện thông minh, tương thích MacBook và điện thoại Android sạc siêu nhanh.",
        "Tai nghe AirPods Pro 2: Chống ồn chủ động (ANC) cải tiến 2 lần, chip H2, cổng sạc USB-C, thời gian nghe lên đến 6 giờ (30 giờ kèm hộp sạc).",
        "Ốp lưng Spigen Samsung S24 Ultra: Chất liệu TPU chống sốc quân đội, thiết kế mỏng nhẹ, có gờ bảo vệ camera và màn hình."
    ]
    product_col.add(
        documents=products,
        ids=[f"prod_{i}" for i in range(len(products))]
    )

    # 2. Chính sách Shop
    policies = [
        "Chính sách bảo hành: Điện thoại bảo hành 12 tháng chính hãng. Phụ kiện bảo hành 6 tháng 1 đổi 1 nếu có lỗi NSX.",
        "Chính sách vận chuyển: Freeship toàn quốc đơn từ 500k. Nội thành Hà Nội/TP.HCM giao hỏa tốc trong 2h.",
        "Chính sách đổi trả: Khách được đổi trả trong 7 ngày đầu nếu sản phẩm còn nguyên seal, chưa kích hoạt (với điện thoại).",
        "Khuyến mãi: Giảm thêm 200k cho khách hàng cũ quay lại mua máy lần 2."
    ]
    policy_col.add(
        documents=policies,
        ids=[f"pol_{i}" for i in range(len(policies))]
    )

    # 3. Kinh nghiệm đã học (Resolved QA)
    qas = [
        "Q: Shop có trả góp không? A: Dạ shop có trả góp 0% qua thẻ tín dụng của 25 ngân hàng hoặc qua công ty tài chính Home Credit/HD Saison.",
        "Q: S24 Ultra có sẵn màu Tím không? A: Dạ hiện tại bản 256GB màu Tím đang sẵn hàng tại chi nhánh Quận 1, mình có thể qua xem trực tiếp ạ.",
        "Q: Cáp Anker có dùng được cho Macbook Air M2 không? A: Dạ hoàn toàn được ạ, cáp hỗ trợ 100W nên sạc tối đa công suất cho Macbook Air luôn ạ."
    ]
    resolved_qa_col.add(
        documents=qas,
        ids=[f"qa_{i}" for i in range(len(qas))]
    )

def seed_sql_db(db):
    print("[3/5] Đang nạp lịch sử giao dịch và hội thoại (SQL)...")
    now = datetime.datetime.utcnow()

    # 1. Chat Logs (Dữ liệu cho Daily Summary và Sensor Insight)
    logs = [
        ChatLog(customer_q="Cáp sạc Anker mới mua 1 tuần đã hỏng, shop làm ăn gì kỳ vậy?", ai_a="Dạ em rất tiếc về trải nghiệm này, em đã chuyển thông tin cho quản lý bảo hành xử lý ngay cho mình ạ.", insight="Khách phàn nàn chất lượng cáp Anker (Lỗi lô hàng?)", timestamp=now - datetime.timedelta(hours=2)),
        ChatLog(customer_q="Bên Hoàng Hà bán S24 Ultra rẻ hơn shop 500k, shop có giảm thêm không?", ai_a="Dạ bên em cam kết hàng chính hãng và có tặng kèm ốp Spigen 350k ạ.", insight="Khách chê giá đắt hơn đối thủ Hoàng Hà", timestamp=now - datetime.timedelta(hours=5)),
        ChatLog(customer_q="Pin con S24 Ultra này dùng thực tế được bao lâu hả shop?", ai_a="Dạ pin 5000mAh dùng hỗn hợp liên tục khoảng 8-10 tiếng ạ.", insight="Khách hỏi nhiều về thời lượng pin S24 Ultra", timestamp=now - datetime.timedelta(hours=8))
    ]
    db.add_all(logs)

    # 2. Review Logs (Kịch bản Khủng hoảng - Crisis)
    reviews = [
        ReviewLog(product_id="ANKER-100W-01", rating=1, review_text="Sạc được 3 ngày thì hỏng, dây nóng ran. Quá thất vọng!", customer_name="Hoàng Mạnh", ai_insight="Cảnh báo: Lỗi cháy nổ/nóng dây cáp Anker"),
        ReviewLog(product_id="ANKER-100W-01", rating=2, review_text="Giao hàng nhanh nhưng cáp dùng chập chờn lúc được lúc không.", customer_name="Lê Văn C", ai_insight="Vấn đề tiếp xúc đầu cắm cáp Anker"),
        ReviewLog(product_id="S24-ULTRA-001", rating=5, review_text="Máy quá đẹp, sếp shop tư vấn nhiệt tình, ship hỏa tốc 1h là nhận được luôn.", customer_name="Nguyễn Tuấn", ai_insight="Khen ngợi dịch vụ giao hàng hỏa tốc"),
        ReviewLog(product_id="AIRPODS-P2", rating=4, review_text="Tai nghe hay, chống ồn tốt nhưng pin không được 6h như quảng cáo, chỉ tầm 5h.", customer_name="Minh Nguyệt", ai_insight="Khách phản hồi pin AirPods thấp hơn kỳ vọng")
    ]
    db.add_all(reviews)

    # 3. Chat Messages (Lịch sử hội thoại thực cho khách VIP để demo RAG + History)
    vip_id = "customer_vip_88"
    msgs = [
        ChatMessage(customer_id=vip_id, role="user", content="Chào shop, mình là khách quen đây."),
        ChatMessage(customer_id=vip_id, role="assistant", content="Dạ chào anh B, rất vui được gặp lại anh! Anh cần hỗ trợ gì cho chiếc iPhone 15 Pro Max anh mua tháng trước ạ?"),
        ChatMessage(customer_id=vip_id, role="user", content="Mình định lấy thêm 3 cái cáp Anker 100W cho công ty, có bớt không?"),
        ChatMessage(customer_id=vip_id, role="assistant", content="Dạ với khách VIP như anh, em giảm thêm 10% tổng đơn phụ kiện và tặng kèm túi đựng cáp chuyên dụng ạ.")
    ]
    db.add_all(msgs)

    # 4. Coordination Tasks (Các nhiệm vụ mà AI giao cho con người)
    tasks = [
        CoordinationTask(target_agent="RiskManager", product_id="ANKER-100W-01", instruction="KHẨN CẤP: Có 2 review 1-2 sao và 3 khách phàn nàn về cáp Anker bị hỏng sau 1 tuần. Kiểm tra ngay lô hàng nhập ngày 01/10.", status="pending"),
        CoordinationTask(target_agent="Pricing", product_id="S24-ULTRA-001", instruction="Đối thủ Hoàng Hà đang giảm giá S24 Ultra xuống còn 28.5tr. Đề xuất điều chỉnh voucher để giữ chân khách hỏi giá.", status="pending"),
        CoordinationTask(target_agent="Content", product_id="S24-ULTRA-001", instruction="Khách hỏi nhiều về pin. Cần bổ sung video test pin thực tế vào mô tả sản phẩm trên Shopee/Tiktok.", status="pending")
    ]
    db.add_all(tasks)
    db.commit()

def seed_content_suggestions(db):
    print("[4/5] Đang nạp đề xuất content mẫu...")
    now = datetime.datetime.utcnow()
    suggestions = [
        ContentSuggestion(
            suggestion_id="cs-seed-001",
            title='Video test pin S24 Ultra — "72 giờ sử dụng thực tế"',
            type="video",
            platform="TikTok + YouTube",
            priority="high",
            status="pending",
            combined_score=94,
            chatbot_count=23,
            chatbot_topic="Hỏi thời lượng pin S24 Ultra",
            review_count=23,
            review_neg_pct=74,
            sample_questions=json.dumps(["Pin dùng được mấy tiếng?", "Pin chơi game thì hao nhanh không?"], ensure_ascii=False),
            sample_reviews=json.dumps(["Pin tụt nhanh khi dùng camera zoom", "Pin không được như quảng cáo"], ensure_ascii=False),
            estimated_impact="Giảm ~60% câu hỏi về pin, tăng CR 8-12%",
            estimated_production="1 ngày quay + editing",
            angle="Test thực tế: sạc đầy lúc 8h sáng, dùng hết ngày làm việc, còn bao nhiêu %?",
            source="content_task",
            source_product_id="S24-ULTRA-001",
            created_at=now
        ),
        ContentSuggestion(
            suggestion_id="cs-seed-002",
            title='"AirPods Pro 2 có dùng được với Android không?" — FAQ + Video test',
            type="blog_faq",
            platform="Blog + TikTok",
            priority="high",
            status="saved",
            combined_score=87,
            chatbot_count=12,
            chatbot_topic="Hỏi kết nối với Samsung/Android",
            review_count=6,
            review_neg_pct=83,
            sample_questions=json.dumps(["Dùng với Samsung được không?", "ANC dùng được trên Android không?"], ensure_ascii=False),
            sample_reviews=json.dumps(["Mua về dùng Samsung, kết nối chập chờn", "ANC không hoạt động trên Android"], ensure_ascii=False),
            estimated_impact="Giảm 40% câu hỏi về Android, set expectations đúng",
            estimated_production="2-3 giờ viết + test",
            angle="Trả lời thẳng: AirPods Pro 2 hoạt động với Android nhưng bị giới hạn tính năng nào...",
            source="content_task",
            source_product_id="AIRPODS-P2",
            created_at=now
        ),
        ContentSuggestion(
            suggestion_id="cs-seed-003",
            title="Bảng giá sỉ B2B — Landing page cho khách doanh nghiệp từ 5 máy",
            type="guide",
            platform="Website + Shopee",
            priority="medium",
            status="pending",
            combined_score=76,
            chatbot_count=12,
            chatbot_topic="Hỏi giá sỉ từ 5 sản phẩm",
            review_count=0,
            review_neg_pct=0,
            sample_questions=json.dumps(["Mua sỉ từ bao nhiêu thì được giảm?", "Có invoice/hóa đơn VAT không?"], ensure_ascii=False),
            sample_reviews=json.dumps([], ensure_ascii=False),
            estimated_impact="Mở rộng kênh B2B, tăng AOV lên 5-10x",
            estimated_production="1 ngày thiết kế landing page",
            angle="Tạo trang giá sỉ riêng với bảng chiết khấu theo số lượng, form liên hệ tư vấn B2B.",
            source="content_task",
            source_product_id="S24-ULTRA-001",
            created_at=now
        ),
    ]
    db.add_all(suggestions)
    db.commit()

def main():
    print("=== AGICOM DEMO SEEDER ===")
    init_db()
    db = SessionLocal()
    
    try:
        p_col, pr_col, qa_col = clear_data(db)
        seed_vector_db(p_col, pr_col, qa_col)
        seed_sql_db(db)
        seed_content_suggestions(db)

        print("\n[SUCCESS] Hệ thống đã sẵn sàng cho Demo!")
        print("- Vector DB: 5 Sản phẩm, 4 Chính sách, 3 QA mẫu.")
        print("- SQL DB: 3 Logs Insight, 4 Reviews (1 Crisis), 4 Messages History, 3 Tasks, 3 Content Suggestions.")
    except Exception as e:
        print(f"\n[ERROR] Lỗi trong quá trình seed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()