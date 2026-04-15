from datetime import datetime
import json
from fastapi import FastAPI, HTTPException
from google.genai import types

# Nhập các thành phần từ file khác
from config import client
from models import (
    IncomingData, ProposalApproval, ChatMessage, ProductRequest,
    GuardrailResponse, StrategyProposal, ShopProfile
)
from prompts import CHAT_SYSTEM_PROMPT, STRATEGY_SYSTEM_PROMPT
from services import (
    analyze_strategy_slow_track,
    customer_care_fast_track,
    analyze_raw_data_phase1,
    learn_from_human_service,
    cskh_rag_service
)
from database import SessionLocal, ChatLog, CoordinationTask, init_db

init_db()

app = FastAPI(title="Agicom Core Backend")

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
async def process_customer_chat(chat: ChatMessage, profile: ShopProfile): # Assume profile passed from frontend
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
        # Chạy qua bộ não RAG
        ai_response = await cskh_rag_service(chat.customer_text, profile.brand_tone)
        
        # LƯU VÀO DB ĐỂ HỌC VÀ BÁO CÁO
        db = SessionLocal()
        new_log = ChatLog(
            customer_q=chat.customer_text,
            ai_a=ai_response["suggested_reply"],
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
async def get_daily_summary():
    db = SessionLocal()
    try:
        # 1. Lấy dữ liệu và ép kiểu về list ngay lập tức để tránh lỗi sau khi đóng db
        tasks = db.query(CoordinationTask).filter(CoordinationTask.status == "pending").all()
        
        # Phân loại task
        pricing_tasks = [t.instruction for t in tasks if t.target_agent == "Pricing"]
        content_tasks = [t.instruction for t in tasks if t.target_agent == "Content"]
        risk_tasks = [t.instruction for t in tasks if t.target_agent == "RiskManager"]
        
        # 2. Lấy insight từ log chat
        recent_logs = db.query(ChatLog).order_by(ChatLog.timestamp.desc()).limit(10).all()
        insights = [log.insight for log in recent_logs if log.insight]
        
        # 3. Sửa lỗi datetime ở đây
        current_date = datetime.now().date().isoformat()
        
        return {
            "date": current_date,
            "risk_management": {
                "status": "Cảnh báo" if len(risk_tasks) > 0 else "An toàn",
                "urgent_actions": risk_tasks
            },
            "growth_strategy": {
                "pricing_proposals": pricing_tasks,
                "content_optimizations": content_tasks
            },
            "customer_sentiment_overview": insights
        }
    except Exception as e:
        # In lỗi thật sự ra Terminal để bạn debug
        print(f"LỖI DAILY SUMMARY: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)