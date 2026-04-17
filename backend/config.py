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
    raise ValueError("LỖI: Không tìm thấy GOOGLE_API_KEY trong biến môi trường")

client = genai.Client(api_key=API_KEY)

# Sử dụng EphemeralClient cho môi trường cloud (Render) vì filesystem là ephemeral.
# Dữ liệu ChromaDB sẽ tồn tại trong RAM suốt vòng đời của server instance.
chroma_client = chromadb.EphemeralClient()

# Sử dụng Embedding mặc định của Chroma
default_ef = embedding_functions.DefaultEmbeddingFunction()

# Gemini Embedding (tuỳ chọn nâng cao)
class GeminiEmbeddingFunction(embedding_functions.EmbeddingFunction):
    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        response = client.models.embed_content(
            model="text-embedding-004",
            contents=input
        )
        return response.embeddings

gemini_ef = GeminiEmbeddingFunction()

# Tạo/Lấy các Collections
policy_col = chroma_client.get_or_create_collection(name="policy_db", embedding_function=default_ef)
product_col = chroma_client.get_or_create_collection(name="product_db", embedding_function=default_ef)
resolved_qa_col = chroma_client.get_or_create_collection(name="resolved_qa_db", embedding_function=default_ef)