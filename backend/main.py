import json
from fastapi import FastAPI, HTTPException
from google.genai import types

# Nhập các thành phần từ file khác
from config import client
from models import (
    IncomingData, ProposalApproval, ChatMessage, ProductRequest,
    GuardrailResponse, StrategyProposal
)
from prompts import CHAT_SYSTEM_PROMPT, STRATEGY_SYSTEM_PROMPT
from services import analyze_strategy_slow_track, customer_care_fast_track

app = FastAPI(title="Agicom Core Backend")

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
async def process_customer_chat(chat: ChatMessage):
    try:
        user_prompt = f"Chính sách shop: {chat.shop_policy}\nTin nhắn của khách: '{chat.customer_text}'"

        # Gọi Gemini xử lý luồng Chat
        response = await client.aio.models.generate_content(
            model="gemini-flash-latest",
            contents=[CHAT_SYSTEM_PROMPT, user_prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GuardrailResponse,
                http_options={'timeout': 30000} # Chat cần phản hồi nhanh hơn Slow Track
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
        # Gom toàn bộ dữ liệu thành "Hồ sơ" đưa cho AI
        user_prompt = f"Hồ sơ dữ liệu sản phẩm hiện tại: {product.model_dump_json()}"

        # Gọi Gemini xử lý luồng chậm (Thời gian suy nghĩ lâu hơn)
        response = await client.aio.models.generate_content(
            model="gemini-flash-latest",
            contents=[STRATEGY_SYSTEM_PROMPT, user_prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=StrategyProposal,
                http_options={'timeout': 60000} # Cho phép AI nghĩ tới 60 giây
            )
        )

        if not response.text:
            raise HTTPException(status_code=500, detail="Lỗi phản hồi từ AI.")
            
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        strategy_result = json.loads(clean_text)

        # BẮT BUỘC LUỒNG SLOW TRACK PHẢI QUA HUMAN-IN-THE-LOOP
        return {
            "status": "success",
            "routing_action": "Sent to Dashboard for Human Approval",
            "proposal_id": f"PROP-{product.product_id}-001",
            "data": strategy_result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)