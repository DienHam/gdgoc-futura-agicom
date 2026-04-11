import os
from dotenv import load_dotenv
from google import genai

# Load các biến môi trường từ file .env
load_dotenv()

# Lấy API Key từ môi trường
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise ValueError("LỖI: Không tìm thấy GOOGLE_API_KEY trong file .env")

client = genai.Client(api_key=API_KEY)