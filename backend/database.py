# database.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./agicom_system.db"
Base = declarative_base()

# Lưu Log Chat để báo cáo cuối ngày
class ChatLog(Base):
    __tablename__ = "chat_logs"
    id = Column(Integer, primary_key=True, index=True)
    customer_q = Column(Text)
    ai_a = Column(Text)
    insight = Column(String) # Ví dụ: "Khách chê đắt"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

# Lưu các Task mà Agent CSKH giao cho Agent khác
class CoordinationTask(Base):
    __tablename__ = "coordination_tasks"
    id = Column(Integer, primary_key=True, index=True)
    target_agent = Column(String) # "Pricing" hoặc "Content"
    product_id = Column(String)
    instruction = Column(Text)
    status = Column(String, default="pending") # pending, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)