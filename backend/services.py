import os
import json
from fastapi import HTTPException
from google.genai import types
from config import policy_col, product_col, resolved_qa_col, client
from prompts import DATA_ANALYST_PROMPT, CHAT_RAG_PROMPT, LEARNING_EXTRACTOR_PROMPT
from models import MarketInsight

def fetch_raw_market_data(sku_id: str) -> dict:
    file_path = f"backend/mock_data/{sku_id}-raw.json"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Không tìm thấy file: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

async def analyze_raw_data_phase1(sku_id: str) -> MarketInsight:
    print(f"[*] PHASE 1: Đang trích xuất dữ liệu thô cho {sku_id}...")
    
    # 1. Đọc dữ liệu thô
    raw_data = fetch_raw_market_data(sku_id)
    user_prompt = f"Dữ liệu thô từ sàn: {json.dumps(raw_data, ensure_ascii=False)}"
    
    # 2. Gọi Gemini đóng vai Data Analyst
    response = await client.aio.models.generate_content(
        model="gemini-flash-latest",
        contents=[DATA_ANALYST_PROMPT, user_prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=MarketInsight,
            http_options={'timeout': 45000}
        )
    )
    
    if not response.text:
        raise HTTPException(status_code=500, detail="Lỗi Phase 1: Không có phản hồi.")
        
    clean_text = response.text.replace("```json", "").replace("```", "").strip()
    insight_dict = json.loads(clean_text)
    
    print(f"[*] PHASE 1 HOÀN TẤT: {insight_dict['analyst_summary']}")
    
    # Trả về cả Insight đã lọc và Internal Data gốc (để lát nữa đưa cho Strategist)
    return {
        "insight": insight_dict,
        "internal_data": raw_data["internal_data"]
    }

async def analyze_strategy_slow_track(data: dict):
    """THINK -> PLAN: Luồng chậm (Phân tích giá & Nội dung)"""
    prompt = f"Phân tích dữ liệu thị trường sau và đưa ra chiến lược định giá/nội dung: {data}"
    
    response = await client.aio.models.generate_content(
        model="gemini-flash-latest",
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    # Trong thực tế, sẽ có response_schema ở đây
    return {"track": "Slow Track", "strategy": "Pricing & Content Proposal", "details": response.text}

async def customer_care_fast_track(data: dict):
    """THINK -> PLAN -> GUARDRAIL: Luồng nhanh (CSKH)"""
    chat_history = data.get("message", "")
    
    # Prompt tích hợp Safety Guardrail
    prompt = f"""Bạn là Agent CSKH. Trả lời tin nhắn sau: '{chat_history}'.
    Đồng thời tự đánh giá độ tự tin (confidence) của bạn từ 0.0 đến 1.0. 
    Nếu bạn không chắc chắn hoặc khách hàng đang giận dữ, hãy cho confidence < 0.7.
    Trả về định dạng JSON: {{"reply": "...", "confidence": 0.9}}"""
    
    response = await client.aio.models.generate_content(
        model="gemini-flash-latest",
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    
    try:
        result = json.loads(response.text)
        confidence = result.get("confidence", 1.0)
        
        # ACT: SAFETY GUARDRAIL LOGIC
        if confidence >= 0.7:
            return {"track": "Fast Track", "action": "Auto Reply to Customers", "message": result["reply"], "status": "Safe"}
        else:
            return {"track": "Fast Track", "action": "Send Proposals to Dashboard", "draft": result["reply"], "status": "Flagged / Low Confidence"}
    except:
        return {"track": "Fast Track", "status": "Error parsing JSON"}

async def cskh_rag_service(customer_text: str, brand_tone: str):
    # Tìm top 3 kết quả thay vì 1
    policy_hits = policy_col.query(query_texts=[customer_text], n_results=3)
    product_hits = product_col.query(query_texts=[customer_text], n_results=3)
    
    # Gộp tất cả các kết quả tìm được thành 1 đoạn văn bản
    def get_all_hits(hits):
        if hits and hits.get('documents') and len(hits['documents'][0]) > 0:
            return "\n- ".join(hits['documents'][0]) # Nối các kết quả bằng dấu gạch đầu dòng
        return "Không có thông tin cụ thể."

    context = f"""
    CÁC THÔNG TIN TÌM THẤY:
    Về quy định: 
    - {get_all_hits(policy_hits)}
    
    Về sản phẩm: 
    - {get_all_hits(product_hits)}
    """
    
    # Debug: In ra terminal để bạn xem AI đang được đọc những gì
    print("--- CONTEXT AI NHẬN ĐƯỢC ---")
    print(context)
    print("----------------------------")

    # 2. GENERATION: Gọi Gemini tạo câu trả lời
    user_prompt = CHAT_RAG_PROMPT.format(context=context, brand_tone=brand_tone)
    
    response = await client.aio.models.generate_content(
        model="gemini-flash-latest",
        contents=[user_prompt, f"Tin nhắn khách: {customer_text}"],
        config={"response_mime_type": "application/json"}
    )
    
    result = json.loads(response.text)
    
    # 3. COORDINATION (Hành động của Cảm biến tiền phương)
    if result.get("sensor_insight"):
        print(f"[!] SENSOR ALERT: {result['sensor_insight']}")
        # Ở đây bạn có thể gọi logic để báo cho Pricing Agent/Content Agent
        # Ví dụ: await trigger_content_update(result['sensor_insight'])

    return result

async def learn_from_human_service(customer_q: str, human_a: str):
    """Lưu cặp Q&A đã được con người duyệt vào Vector DB"""
    # Dùng LLM để format lại cho 'sạch' trước khi lưu
    prompt = LEARNING_EXTRACTOR_PROMPT.format(chat_log=f"Q: {customer_q}, A: {human_a}")
    response = await client.aio.models.generate_content(model="gemini-flash-latest", contents=prompt)
    
    data = json.loads(response.text)
    
    # Lưu vào ChromaDB
    resolved_qa_col.add(
        documents=[f"Q: {data['question']} A: {data['answer']}"],
        ids=[f"qa_{hash(data['question'])}"]
    )
    return {"status": "Learned successfully"}