from datetime import datetime
import json
import hashlib
import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from google.genai import types

# Nhập các thành phần từ file khác
from config import client, resolved_qa_col
from models import (
    IncomingData, ProposalApproval, ChatMessageRequest, ProductRequest,
    GuardrailResponse, StrategyProposal, ShopProfile, ChatSessionInput, ChatMessage, ReviewData
)
from prompts import CHAT_SYSTEM_PROMPT, STRATEGY_SYSTEM_PROMPT, REVIEW_LEARNING_PROMPT
from services import (
    analyze_strategy_slow_track,
    customer_care_fast_track,
    analyze_raw_data_phase1,
    learn_from_human_service,
    cskh_rag_service,
    chat_with_history_service
)
from database import SessionLocal, ChatLog, CoordinationTask, ChatMessage as DB_ChatMessage, save_message, init_db, DailySummaryArchive, ReviewLog, ContentSuggestion

init_db()

app = FastAPI(title="Agicom Core Backend")

# ---------------------------------------------------------------------------
# CORS – cho phép frontend Netlify và localhost kết nối
# Có thể thu hẹp lại bằng cách set biến môi trường FRONTEND_URL trên Render
# ---------------------------------------------------------------------------
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

ALLOWED_ORIGINS = ["*"] if FRONTEND_URL == "*" else [
    FRONTEND_URL,
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False if FRONTEND_URL == "*" else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint cho Render"""
    return {"status": "ok", "message": "Agicom Backend đang chạy!", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/test-phase1/{sku_id}")
async def test_data_analyst_agent(sku_id: str):
    """API dùng để test khả năng đọc Raw Data của LLM Phase 1"""
    try:
        result = await analyze_raw_data_phase1(sku_id)
        return {
            "status": "success",
            "message": "Data Analyst đã trích xuất thành công!",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/observe-and-think")
async def process_data_pipeline(input_data: IncomingData):
    """
    OBSERVE -> PROCESS IN BACKEND -> TASK ROUTER
    Đây là "cánh cửa" nhận mọi dữ liệu từ bên ngoài (API Sàn / File giả lập).
    """
    try:
        print(f"[*] OBSERVE: Nhận dữ liệu loại '{input_data.data_type}'")
        
        # TASK ROUTER LOGIC
        if input_data.data_type == "market_data":
            print("[*] TASK ROUTER: Chuyển hướng sang Slow Track (Chiến lược)")
            proposal = await analyze_strategy_slow_track(input_data.payload)
            # PLAN -> ACT
            return {"status": "success", "routing": "Strategy", "action": "Send Proposals to Dashboard", "data": proposal}
            
        elif input_data.data_type == "customer_chat":
            print("[*] TASK ROUTER: Chuyển hướng sang Fast Track (CSKH)")
            chat_response = await customer_care_fast_track(input_data.payload)
            return {"status": "success", "routing": "Chat", "data": chat_response}
            
        else:
            raise HTTPException(status_code=400, detail="Loại dữ liệu không hợp lệ")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/act-and-learn")
async def human_approval_flow(approval: ProposalApproval):
    """
    ACT -> HUMAN APPROVAL -> LEARN
    Mô phỏng thao tác của Chủ shop trên Dashboard.
    """
    if approval.status == "approved":
        print(f"[*] ACT: Execute on Platforms (Gửi lệnh cập nhật giá lên Shopee API)")
        print(f"[*] LEARN: Store in Vector Database (Lưu chiến lược thành công)")
        return {"status": "Executed & Learned", "message": "Đã đồng bộ lên sàn và lưu vào ChromaDB"}
    
    elif approval.status == "declined":
        print(f"[*] ACT: Declined. User Feedback: {approval.feedback}")
        print(f"[*] RE-EVALUATE: Gửi feedback '{approval.feedback}' về lại LLM Framework")
        return {"status": "Re-evaluating", "message": "Đang tính toán lại dựa trên phản hồi của bạn"}

@app.post("/fast-track-chat")
async def process_customer_chat(chat: ChatMessageRequest, profile: ShopProfile): # Assume profile passed from frontend
    try:
        # Inject Tone and Target Customers
        personalized_chat_prompt = CHAT_SYSTEM_PROMPT.format(
            brand_tone=profile.brand_tone,
            target_customers=profile.target_customers
        )

        user_prompt = f"Chính sách shop: {chat.shop_policy}\nTin nhắn của khách: '{chat.customer_text}'"

        response = await client.aio.models.generate_content(
            model="gemini-flash-latest",
            contents=[personalized_chat_prompt, user_prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GuardrailResponse,
                http_options={'timeout': 30000} # GIỮ NGUYÊN 30S
            )
        )

        if not response.text:
            raise HTTPException(status_code=500, detail="Lỗi phản hồi từ AI.")
            
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        guardrail_result = json.loads(clean_text)

        # --- ROUTER LOGIC: Tự động hay Cần người duyệt? ---
        if guardrail_result["is_safe"] and guardrail_result["confidence_score"] >= 0.7:
            # AUTO REPLY: Gửi thẳng cho khách
            action = "Auto-Reply Executed"
            status_color = "Green"
        else:
            # MANUAL REVIEW: Đẩy lên Dashboard cho Chủ shop xem
            action = "Sent to Dashboard for Human Approval"
            status_color = "Red/Orange"

        return {
            "status": "success",
            "routing_action": action,
            "system_color": status_color,
            "ai_evaluation": guardrail_result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/slow-track-strategy")
async def process_market_strategy(product: ProductRequest):
    try:
        # Inject personalization into the prompt
        personalized_system_prompt = STRATEGY_SYSTEM_PROMPT.format(
            strategic_vision=product.shop_profile.strategic_vision,
            target_customers=product.shop_profile.target_customers
        )

        user_prompt = f"Hồ sơ dữ liệu sản phẩm hiện tại: {product.model_dump_json()}"

        # Keep your existing structure and timeouts
        response = await client.aio.models.generate_content(
            model="gemini-flash-latest",
            contents=[personalized_system_prompt, user_prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=StrategyProposal,
                http_options={'timeout': 60000} # 60s timeout
            )
        )

        if not response.text:
            raise HTTPException(status_code=500, detail="Lỗi phản hồi từ AI.")
            
        # GIỮ NGUYÊN LOGIC CLEAN TEXT
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        strategy_result = json.loads(clean_text)

        # New Logic: Routing based on "Action Required"
        routing_msg = "Sent to Dashboard for Human Approval" if strategy_result.get("action_required") else "No Action Needed - Monitored"

        return {
            "status": "success",
            "routing_action": routing_msg,
            "proposal_id": f"PROP-{product.product_id}-001",
            "data": strategy_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fast-track-chat-v2")
async def process_chat_v2(chat: ChatMessage, profile: ShopProfile):
    try:
        ai_response = await cskh_rag_service(chat.customer_text, profile.brand_tone)
        db = SessionLocal()
        new_log = ChatLog(
            customer_q=chat.customer_text,
            ai_a=ai_response.get("suggested_reply", ""),
            insight=ai_response.get("sensor_insight")
        )
        db.add(new_log)
        db.commit()
        db.close()
        
        return {"status": "success", "data": ai_response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/learn-feedback")
async def human_feedback(customer_q: str, human_a: str):
    """API để chủ shop 'dạy' AI khi họ sửa câu trả lời trên Dashboard"""
    return await learn_from_human_service(customer_q, human_a)

@app.get("/daily-summary")
async def get_daily_summary(archive: bool = Query(False, description="Nếu True, sẽ lưu trữ dữ liệu đi sau khi xuất")):
    db = SessionLocal()
    try:
        tasks = db.query(CoordinationTask).filter(CoordinationTask.status == "pending").all()
        
        pricing_tasks = [t.instruction for t in tasks if t.target_agent == "Pricing"]
        content_tasks = [t.instruction for t in tasks if t.target_agent == "Content"]
        risk_tasks = [t.instruction for t in tasks if t.target_agent == "RiskManager"]
        
        display_logs = db.query(ChatLog).filter(ChatLog.is_archived == False).order_by(ChatLog.timestamp.desc()).limit(20).all()
        insights = [log.insight for log in display_logs if log.insight]
        
        current_date = datetime.now().date()
        risk_status = "Cảnh báo" if len(risk_tasks) > 0 else "An toàn"
        
        if archive:
            archive_record = DailySummaryArchive(
                report_date=current_date,
                archived_at=datetime.utcnow(),
                risk_status=risk_status,
                risk_tasks_json=json.dumps(risk_tasks, ensure_ascii=False),
                pricing_tasks_json=json.dumps(pricing_tasks, ensure_ascii=False),
                content_tasks_json=json.dumps(content_tasks, ensure_ascii=False),
                insights_json=json.dumps(insights, ensure_ascii=False),
                total_tasks=len(tasks),
                total_insights=len(insights)
            )
            db.add(archive_record)
            
            for t in tasks:
                t.status = "archived"
                
            all_unarchived_logs = db.query(ChatLog).filter(ChatLog.is_archived == False).all()
            for log in all_unarchived_logs:
                log.is_archived = True
                
            db.commit()
        
        return {
            "date": current_date.isoformat(),
            "risk_management": {
                "status": risk_status,
                "urgent_actions": risk_tasks
            },
            "growth_strategy": {
                "pricing_proposals": pricing_tasks,
                "content_optimizations": content_tasks
            },
            "customer_sentiment_overview": insights
        }
    except Exception as e:
        db.rollback()
        print(f"LỖI DAILY SUMMARY: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.post("/export-daily-summary")
async def export_and_archive_daily_summary():
    return await get_daily_summary(archive=True)

@app.get("/api/chatbot/features")
async def get_chatbot_features():
    return {
        "features":[
            {
                "id": "sentiment",
                "title": "Phân tích cảm xúc",
                "status": "Ổn định",
                "detail": "Theo dõi trạng thái cảm xúc theo từng cụm hội thoại để cảnh báo sớm nhóm khách tiêu cực.",
            },
            {
                "id": "faq-report",
                "title": "Báo cáo thắc mắc",
                "status": "Đang cập nhật",
                "detail": "Tổng hợp câu hỏi lặp lại trong ngày, ưu tiên theo tần suất và mức độ ảnh hưởng.",
            },
        ]
    }

@app.get("/api/quality/overview")
async def get_quality_overview():
    return {
        "items":[
            {
                "id": "chatbot-summary",
                "title": "Tổng hợp từ chat bot",
                "value": "128 tín hiệu/7 ngày",
                "note": "Hệ thống gom nhóm phản hồi theo chủ đề sản phẩm, kênh bán và thời điểm phát sinh.",
            },
            {
                "id": "crisis-management",
                "title": "Quản trị khủng hoảng",
                "value": "1 cảnh báo cần xử lý",
                "note": "Phát hiện cụm phản hồi tiêu cực tăng nhanh ở nhóm giao vận, đề xuất xử lý ưu tiên trong 24 giờ.",
            },
        ]
    }

@app.post("/learn-from-review")
async def process_and_learn_review(review: ReviewData):
    try:
        # 1. AI Phân tích Review
        user_prompt = f"Sản phẩm ID: {review.product_id}\nSố sao: {review.rating}/5\nNội dung: '{review.review_text}'"
        response = await client.aio.models.generate_content(
            model="gemini-flash-latest",
            contents=[REVIEW_LEARNING_PROMPT, user_prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        analysis = json.loads(clean_text)
        
        # 2. LƯU BÀI HỌC VÀO VECTOR DB (Dành cho AI Chatbot đọc)
        if analysis.get("qa_knowledge") and analysis["qa_knowledge"] != "None":
            doc_id = hashlib.md5(review.review_text.encode()).hexdigest()
            resolved_qa_col.add(
                documents=[f"[Kinh nghiệm từ Review {review.rating} sao]: {analysis['qa_knowledge']}"],
                ids=[f"rev_{doc_id}"]
            )

        # 3. LƯU REVIEW GỐC & TẠO TASK VÀO SQL (Dành cho Dashboard hiển thị)
        db = SessionLocal()
        try:
            # Lưu lịch sử Review gốc
            new_review_log = ReviewLog(
                product_id=review.product_id,
                rating=review.rating,
                review_text=review.review_text,
                customer_name=review.customer_name,
                ai_insight=analysis.get('qa_knowledge', "Không có insight nổi bật")
            )
            db.add(new_review_log)

            # Tạo Task nếu Review xấu
            if analysis.get("action_needed") or review.rating <= 3:
                instruction = f"CẢNH BÁO REVIEW {review.rating} SAO: {analysis.get('key_issue')}. Nội dung: '{review.review_text}'"
                
                target_agent = "RiskManager"
                if "giá" in review.review_text.lower():
                    target_agent = "Pricing"
                elif "màu" in review.review_text.lower():
                    target_agent = "Content"
                    
                new_task = CoordinationTask(
                    target_agent=target_agent,
                    product_id=review.product_id,
                    instruction=instruction,
                    status="pending"
                )
                db.add(new_task)
            
            db.commit()
        except Exception as db_e:
            db.rollback()
            print("Lỗi Database:", db_e)
        finally:
            db.close()

        return {"status": "success", "message": "Đã lưu Review & Cập nhật trí nhớ AI"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reviews")
async def get_all_reviews(product_id: str = None, limit: int = 20):
    """
    API dùng để kéo dữ liệu Review từ Database ra cho Frontend hiển thị.
    Nếu truyền product_id thì chỉ lấy review của sản phẩm đó.
    """
    db = SessionLocal()
    try:
        query = db.query(ReviewLog)
        
        # Lọc theo sản phẩm nếu Frontend có truyền product_id
        if product_id:
            query = query.filter(ReviewLog.product_id == product_id)
            
        # Sắp xếp mới nhất đưa lên đầu
        reviews = query.order_by(ReviewLog.timestamp.desc()).limit(limit).all()
        
        return {
            "total_fetched": len(reviews),
            "data": reviews
        }
    finally:
        db.close()

@app.get("/api/crisis-overview")
async def get_crisis_overview():
    """
    Tổng hợp tín hiệu khủng hoảng từ Reviews tiêu cực và CoordinationTasks rủi ro.
    Dùng để đồng bộ frontend Quản trị Khủng hoảng với dữ liệu thực.
    """
    db = SessionLocal()
    try:
        # 1. Lấy tất cả task RiskManager đang pending
        risk_tasks = db.query(CoordinationTask).filter(
            CoordinationTask.target_agent == "RiskManager",
            CoordinationTask.status == "pending"
        ).order_by(CoordinationTask.id.desc()).all()

        # 2. Lấy review tiêu cực (rating <= 3)
        neg_reviews = db.query(ReviewLog).filter(
            ReviewLog.rating <= 3
        ).order_by(ReviewLog.timestamp.desc()).limit(20).all()

        # 3. Lấy chat insights có rủi ro (dùng keyword trong insight)
        risk_chat_logs = db.query(ChatLog).filter(
            ChatLog.is_archived == False,
            ChatLog.insight.isnot(None),
            ChatLog.insight != ""
        ).order_by(ChatLog.timestamp.desc()).limit(30).all()

        risk_keywords = ["lỗi", "hỏng", "kém", "tệ", "xấu", "complain", "khiếu nại", "trả hàng", "hoàn tiền", "bức xúc", "tức"]
        risk_chat_insights = [
            log for log in risk_chat_logs
            if any(kw in (log.insight or "").lower() for kw in risk_keywords)
        ]

        # 4. Gom nhóm tín hiệu tiêu cực theo sản phẩm
        product_signals: dict = {}

        for r in neg_reviews:
            pid = r.product_id or "unknown"
            if pid not in product_signals:
                product_signals[pid] = {"neg_reviews": [], "risk_tasks": [], "chat_signals": []}
            product_signals[pid]["neg_reviews"].append({
                "rating": r.rating,
                "text": (r.review_text or "")[:120],
                "insight": r.ai_insight or "",
                "customer": r.customer_name or "Ẩn danh",
                "time": r.timestamp.strftime("%H:%M, %d/%m/%Y") if r.timestamp else ""
            })

        for t in risk_tasks:
            pid = t.product_id or "unknown"
            if pid not in product_signals:
                product_signals[pid] = {"neg_reviews": [], "risk_tasks": [], "chat_signals": []}
            product_signals[pid]["risk_tasks"].append(t.instruction or "")

        for log in risk_chat_insights:
            pid = "chat_general"
            if pid not in product_signals:
                product_signals[pid] = {"neg_reviews": [], "risk_tasks": [], "chat_signals": []}
            product_signals[pid]["chat_signals"].append(log.insight or "")

        # 5. Tính severity cho từng sản phẩm
        crises = []
        for pid, data in product_signals.items():
            neg_count = len(data["neg_reviews"])
            task_count = len(data["risk_tasks"])
            chat_count = len(data["chat_signals"])

            # Tính severity score (tối đa 100)
            score = min(100, neg_count * 15 + task_count * 25 + chat_count * 10)

            if score >= 60:
                severity = "critical"
            elif score >= 25:
                severity = "warning"
            else:
                severity = "monitoring"

            crises.append({
                "product_id": pid,
                "severity": severity,
                "severity_score": score,
                "neg_review_count": neg_count,
                "risk_task_count": task_count,
                "chat_signal_count": chat_count,
                "reviews": data["neg_reviews"][:3],
                "risk_tasks": data["risk_tasks"][:5],
                "chat_signals": data["chat_signals"][:3],
                "detected_from": "live_backend"
            })

        # Sắp xếp theo severity score giảm dần
        crises.sort(key=lambda x: x["severity_score"], reverse=True)

        # 6. Trạng thái tổng thể
        if any(c["severity"] == "critical" for c in crises):
            overall_status = "critical"
        elif any(c["severity"] == "warning" for c in crises):
            overall_status = "warning"
        elif crises:
            overall_status = "monitoring"
        else:
            overall_status = "safe"

        return {
            "overall_status": overall_status,
            "total_crisis_products": len(crises),
            "total_neg_reviews": len(neg_reviews),
            "total_risk_tasks": len(risk_tasks),
            "total_chat_signals": len(risk_chat_insights),
            "crises": crises,
            "last_updated": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.post("/chat-v3")
async def process_chat_with_history(data: ChatSessionInput):
    db = SessionLocal()
    try:
        # 1. Lưu tin nhắn của Người dùng vào SQLite
        save_message(db, data.customer_id, "user", data.message)

        # 2. Xử lý Logic AI (Lấy history -> RAG -> Gemini)
        ai_response = await chat_with_history_service(
            db, data.customer_id, data.message, data.brand_tone
        )
        
        reply_content = ai_response.get("suggested_reply", "Dạ, em chưa hiểu ý mình ạ.")

        # 3. Lưu câu trả lời của AI vào SQLite
        save_message(db, data.customer_id, "assistant", reply_content)

        # 4. Trả về cho Frontend
        return {
            "status": "success",
            "customer_id": data.customer_id,
            "reply": reply_content,
            "ai_evaluation": ai_response
        }
    except Exception as e:
        print(f"LỖI CHAT HISTORY: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.delete("/chat/{customer_id}")
async def delete_chat_history(customer_id: str):
    db = SessionLocal()
    try:
        # Xóa các tin nhắn trong bảng ChatMessage của user này
        db.query(DB_ChatMessage).filter(DB_ChatMessage.customer_id == customer_id).delete()
        db.commit()
        return {"status": "success", "message": f"Đã xóa lịch sử chat của {customer_id}"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "detail": str(e)}
    finally:
        db.close()

@app.get("/api/content-suggestions")
async def get_content_suggestions():
    """
    Tổng hợp tín hiệu content từ CoordinationTask + ChatLog + ReviewLog.
    Trả về danh sách đề xuất có cấu trúc để frontend hiển thị và merge với MOCK.
    """
    db = SessionLocal()
    try:
        # 1. Lấy ContentSuggestion đã lưu/lên lịch (chưa bị ignored)
        saved_sugs = db.query(ContentSuggestion).filter(
            ContentSuggestion.status != "ignored"
        ).order_by(ContentSuggestion.combined_score.desc()).all()

        # 2. Lấy content tasks đang pending
        content_tasks = db.query(CoordinationTask).filter(
            CoordinationTask.target_agent == "Content",
            CoordinationTask.status == "pending"
        ).order_by(CoordinationTask.id.desc()).all()

        # 3. Tín hiệu từ reviews tiêu cực (group by product)
        neg_reviews = db.query(ReviewLog).filter(
            ReviewLog.rating <= 3
        ).order_by(ReviewLog.timestamp.desc()).limit(30).all()

        # 4. Tín hiệu từ chat logs gần đây
        recent_insights = db.query(ChatLog).filter(
            ChatLog.is_archived == False,
            ChatLog.insight.isnot(None)
        ).order_by(ChatLog.timestamp.desc()).limit(20).all()

        suggestions = []

        # -- Từ ContentSuggestion đã lưu trong DB --
        saved_suggestion_ids = set()
        for s in saved_sugs:
            saved_suggestion_ids.add(s.suggestion_id)
            sq = []
            sr = []
            try:
                sq = json.loads(s.sample_questions or "[]")
            except Exception:
                pass
            try:
                sr = json.loads(s.sample_reviews or "[]")
            except Exception:
                pass
            suggestions.append({
                "id": s.suggestion_id,
                "db_id": s.id,
                "title": s.title,
                "type": s.type or "guide",
                "platform": s.platform or "Blog + Website",
                "priority": s.priority or "medium",
                "status": s.status,
                "combined_score": s.combined_score or 70,
                "chatbot_signal": {
                    "count": s.chatbot_count or 0,
                    "topic": s.chatbot_topic or "Từ backend",
                    "sample_questions": sq
                },
                "review_signal": {
                    "count": s.review_count or 0,
                    "neg_pct": s.review_neg_pct or 0,
                    "sample_reviews": sr
                },
                "angle": s.angle or "",
                "estimated_impact": s.estimated_impact or "Cải thiện trải nghiệm khách hàng",
                "estimated_production": s.estimated_production or "1-2 ngày",
                "_fromBackend": True,
                "_source": s.source or "db"
            })

        # -- Từ CoordinationTask target_agent=Content (chưa có trong DB) --
        def _detect_type(text):
            t = (text or "").lower()
            if any(k in t for k in ["video", "quay", "tiktok", "youtube"]):
                return "video"
            if any(k in t for k in ["so sánh", " vs ", "compare"]):
                return "comparison"
            if any(k in t for k in ["faq", "blog", "hướng dẫn", "câu hỏi", "giải đáp"]):
                return "blog_faq"
            return "guide"

        def _platform_for(t):
            return {
                "video": "TikTok + YouTube",
                "blog_faq": "Blog + Website",
                "comparison": "Blog + YouTube",
                "guide": "Website + Shopee"
            }.get(t, "Đa nền tảng")

        neg_by_product = {}
        for r in neg_reviews:
            pid = r.product_id or "unknown"
            neg_by_product.setdefault(pid, []).append(r)

        for task in content_tasks:
            task_sug_id = f"task-{task.id}"
            if task_sug_id in saved_suggestion_ids:
                continue  # đã có trong DB rồi

            related_neg = neg_by_product.get(task.product_id or "", [])
            sug_type = _detect_type(task.instruction)
            score = min(99, 65 + len(related_neg) * 8 + (10 if related_neg else 0))

            suggestions.append({
                "id": task_sug_id,
                "title": (task.instruction or "")[:100],
                "type": sug_type,
                "platform": _platform_for(sug_type),
                "priority": "high" if len(related_neg) >= 1 or score >= 80 else "medium",
                "status": "pending",
                "combined_score": score,
                "chatbot_signal": {
                    "count": len(recent_insights),
                    "topic": "Phát hiện từ báo cáo hàng ngày",
                    "sample_questions": [log.customer_q[:60] for log in recent_insights[:2]]
                },
                "review_signal": {
                    "count": len(related_neg),
                    "neg_pct": 100 if related_neg else 0,
                    "sample_reviews": [(r.review_text or "")[:60] for r in related_neg[:2]]
                },
                "angle": task.instruction or "",
                "estimated_impact": f"Giảm câu hỏi lặp lại ~30–50%",
                "estimated_production": {"video": "1-2 ngày", "blog_faq": "2-4 giờ", "comparison": "1 ngày", "guide": "3-5 giờ"}.get(sug_type, "1-2 ngày"),
                "_fromBackend": True,
                "_source": "content_task"
            })

        # Sắp xếp: đã lưu/lên lịch lên đầu, rồi theo score
        suggestions.sort(key=lambda x: (0 if x["status"] in ("saved", "scheduled") else 1, -x["combined_score"]))

        return {
            "total": len(suggestions),
            "suggestions": suggestions,
            "meta": {
                "neg_review_count": len(neg_reviews),
                "content_tasks_count": len(content_tasks),
                "chat_signals_count": len(recent_insights),
                "saved_in_db": len(saved_sugs)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.patch("/api/content-suggestions/{suggestion_id}/status")
async def update_content_suggestion_status(suggestion_id: str, body: dict):
    """
    Cập nhật trạng thái đề xuất content: pending | saved | scheduled | ignored.
    Tự động tạo mới bản ghi nếu chưa có trong DB.
    """
    new_status = body.get("status")
    if new_status not in ("pending", "saved", "scheduled", "ignored"):
        raise HTTPException(status_code=400, detail="status không hợp lệ")

    db = SessionLocal()
    try:
        sug = db.query(ContentSuggestion).filter(
            ContentSuggestion.suggestion_id == suggestion_id
        ).first()

        if sug:
            sug.status = new_status
            sug.updated_at = datetime.utcnow()
        else:
            # Tạo bản ghi tối giản để lưu trạng thái
            title = body.get("title", suggestion_id)
            sug = ContentSuggestion(
                suggestion_id=suggestion_id,
                title=title[:200] if title else suggestion_id,
                type=body.get("type", "guide"),
                platform=body.get("platform", ""),
                priority=body.get("priority", "medium"),
                status=new_status,
                combined_score=int(body.get("combined_score", 0)),
                chatbot_count=int(body.get("chatbot_count", 0)),
                chatbot_topic=body.get("chatbot_topic", ""),
                review_count=int(body.get("review_count", 0)),
                review_neg_pct=int(body.get("review_neg_pct", 0)),
                sample_questions=json.dumps(body.get("sample_questions", []), ensure_ascii=False),
                sample_reviews=json.dumps(body.get("sample_reviews", []), ensure_ascii=False),
                angle=body.get("angle", ""),
                estimated_impact=body.get("estimated_impact", ""),
                estimated_production=body.get("estimated_production", ""),
                source=body.get("source", "frontend")
            )
            db.add(sug)

        db.commit()
        return {"status": "success", "suggestion_id": suggestion_id, "new_status": new_status}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.post("/system/reset-all")
async def reset_all_data():
    db = SessionLocal()
    try:
        # 1. Xóa sạch các bảng trong SQL
        db.query(DB_ChatMessage).delete()
        db.query(ChatLog).delete()
        db.query(CoordinationTask).delete()
        db.commit()

        # 2. Xóa sạch kiến thức trong Vector DB (ChromaDB)
        from config import chroma_client
        # Lấy danh sách tất cả collections và xóa sạch
        all_cols = ["policy_db", "product_db", "resolved_qa_db"]
        for col in all_cols:
            try:
                chroma_client.delete_collection(col)
                # Tạo lại collection trống ngay lập tức
                chroma_client.get_or_create_collection(col)
            except:
                pass

        return {"status": "success", "message": "Hệ thống đã được đưa về trạng thái trắng."}
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)