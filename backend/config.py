import os
from dotenv import load_dotenv
from google import genai
import chromadb
from chromadb.utils import embedding_functions

# Load các biến môi trường từ file .env
load_dotenv()

# Lấy API Key từ môi trường
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise ValueError("LỖI: Không tìm thấy GOOGLE_API_KEY trong file .env")

client = genai.Client(api_key=API_KEY)

# Khởi tạo ChromaDB Client (Lưu local)
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Sử dụng Embedding mặc định hoặc Gemini Embedding (nếu muốn tối ưu)
# Ở đây dùng mặc định của Chroma để đơn giản cho MVP
default_ef = embedding_functions.DefaultEmbeddingFunction()

# Gemini Embedding
class GeminiEmbeddingFunction(embedding_functions.EmbeddingFunction):
    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        # Gọi API Gemini để lấy vector (nhanh và không tốn RAM máy)
        response = client.models.embed_content(
            model="text-embedding-004", # Model embedding của Google
            contents=input
        )
        return response.embeddings

gemini_ef = GeminiEmbeddingFunction()

# Tạo/Lấy các Collections
policy_col = chroma_client.get_or_create_collection(name="policy_db", embedding_function=default_ef)
product_col = chroma_client.get_or_create_collection(name="product_db", embedding_function=default_ef)
resolved_qa_col = chroma_client.get_or_create_collection(name="resolved_qa_db", embedding_function=default_ef)