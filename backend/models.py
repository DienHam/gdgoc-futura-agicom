from pydantic import BaseModel

class InternalData(BaseModel):
    current_price: float
    stock_level: int
    cost_price: float
    min_margin_percent: float
    conversion_rate: float = 0.05  # THÊM MỚI: Mặc định là 5% (0.05)

class MarketData(BaseModel):
    competitor_min_price: float
    market_trend: str
    competitor_name: str
    competitor_rating: float = 4.5  # THÊM MỚI: Rating đối thủ
    our_rating: float = 4.8         # THÊM MỚI: Rating của shop mình
    platform_campaign: str = "None" # THÊM MỚI: Ví dụ "Mega Sale 4.4", "None"

class CustomerContext(BaseModel):
    recent_sentiment: str
    frequent_question: str

class IncomingData(BaseModel):
    data_type: str  # "market_data" hoặc "customer_chat"
    payload: dict   # Chứa nội dung data

class ProposalApproval(BaseModel):
    proposal_id: str
    status: str     # "approved" hoặc "declined"
    feedback: str = ""

class ChatMessage(BaseModel):
    shop_policy: str = "Đổi trả trong 7 ngày. Phí ship khách chịu."
    customer_text: str

class GuardrailResponse(BaseModel):
    suggested_reply: str
    confidence_score: float  # Từ 0.0 đến 1.0
    is_safe: bool            # True nếu an toàn để gửi tự động
    flag_reason: str         # Lý do nếu bị cờ (ví dụ: Khách chửi bới, đòi giảm giá)

class StrategyProposal(BaseModel):
    proposed_price: float
    expected_margin_percent: float
    pricing_reasoning: str
    content_update_suggestion: str
    urgency_level: str  # "High" (Cần duyệt gấp), "Medium", "Low"

class ProductRequest(BaseModel):
    product_id: str
    product_name: str
    internal_data: InternalData
    market_data: MarketData
    customer_context: CustomerContext
    manager_directive: str = "Không có chỉ thị đặc biệt"