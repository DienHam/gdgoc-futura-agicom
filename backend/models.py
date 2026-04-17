from pydantic import BaseModel
from typing import List

class ShopProfile(BaseModel):
    target_customers: str = "Khách hàng phổ thông"
    strategic_vision: str = "Tối ưu lợi nhuận dài hạn"
    brand_tone: str = "Chuyên nghiệp, nhiệt tình"

class InternalData(BaseModel):
    current_price: float
    stock_level: int
    cost_price: float
    min_margin_percent: float
    conversion_rate: float = 0.05

class MarketData(BaseModel):
    competitor_min_price: float
    market_trend: str
    competitor_name: str
    competitor_rating: float = 4.5
    our_rating: float = 4.8
    platform_campaign: str = "None"

class MarketInsight(BaseModel):
    competitor_min_price: float
    competitor_avg_price: float
    market_trend: str
    overall_sentiment: str
    customer_pain_points: List[str]
    top_frequent_questions: List[str]
    analyst_summary: str

class CustomerContext(BaseModel):
    recent_sentiment: str
    frequent_question: str

class IncomingData(BaseModel):
    data_type: str
    payload: dict

class ProposalApproval(BaseModel):
    proposal_id: str
    status: str
    feedback: str = ""

class ChatMessageRequest(BaseModel):
    shop_policy: str = ""
    customer_text: str

class ChatMessage(BaseModel):
    shop_policy: str = "Đổi trả trong 7 ngày. Phí ship khách chịu."
    customer_text: str

class GuardrailResponse(BaseModel):
    suggested_reply: str
    confidence_score: float
    is_safe: bool
    flag_reason: str

class StrategyProposal(BaseModel):
    action_required: bool
    proposed_price: float
    expected_margin_percent: float
    pricing_reasoning: str
    content_update_suggestion: str
    urgency_level: str

class ProductRequest(BaseModel):
    product_id: str
    product_name: str
    internal_data: InternalData
    market_data: MarketData
    customer_context: CustomerContext
    shop_profile: ShopProfile
    manager_directive: str = "Không có chỉ thị đặc biệt"

class ChatSessionInput(BaseModel):
    customer_id: str
    message: str
    brand_tone: str = "Chuyên nghiệp, nhiệt tình"

class ReviewData(BaseModel):
    product_id: str
    rating: int          # Số sao (1-5)
    review_text: str     # Nội dung đánh giá
    customer_name: str = "Khách hàng Ẩn danh"

class ReviewExtractedInsight(BaseModel):
    sentiment: str       # Tiêu cực, Tích cực, Bình thường
    key_issue: str       # Vấn đề cốt lõi (vd: "Giao hàng chậm", "Lỗi móp méo")
    action_needed: bool  # Có cần agent khác xử lý không?
    qa_knowledge: str    # Bài học rút ra (ví dụ: "Nếu khách hỏi về móp méo, hãy báo do vận chuyển và xin lỗi")