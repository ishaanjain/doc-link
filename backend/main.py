from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pdfminer.high_level import extract_text
import anthropic
import os
import base64
from dotenv import load_dotenv
from typing import List

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories if they don't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("texts", exist_ok=True)

# Initialize Anthropic client
anthropic_client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

async def extract_requirements_with_anthropic(pdf_path: str) -> str:
    """Extract requirements from PDF using Anthropic API"""
    try:
        # Read and encode the PDF file as base64
        with open(pdf_path, "rb") as file:
            pdf_data = file.read()
            import base64
            pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
        
        # Request requirements extraction
        response = anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text", 
                        "text": "Extract all product verification requirements from this document and return them as a Python list of strings. Each requirement should be a separate string in the list. Focus on specific, testable requirements that can be verified."
                    },
                    {
                        "type": "document", 
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": pdf_base64
                        }
                    }
                ]
            }]
        )
        
        return response.content[0].text
        
    except Exception as e:
        # Fallback to text extraction if Anthropic fails
        print(f"Anthropic API failed: {e}. Falling back to text extraction.")
        return extract_text(pdf_path)

@app.post("/api/convert")
async def convert_pdfs(left_file: UploadFile = File(...), right_file: UploadFile = File(...)):
    if not left_file.filename.lower().endswith('.pdf') or not right_file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Process left file (requirements extraction with Anthropic)
        left_content = await left_file.read()
        left_pdf_path = f"uploads/{left_file.filename}"
        with open(left_pdf_path, "wb") as buffer:
            buffer.write(left_content)
        
        # Extract requirements using Anthropic API
        left_text = await extract_requirements_with_anthropic(left_pdf_path)
        
        # Process right file (regular text extraction)
        right_content = await right_file.read()
        right_pdf_path = f"uploads/{right_file.filename}"
        with open(right_pdf_path, "wb") as buffer:
            buffer.write(right_content)
        right_text = extract_text(right_pdf_path)
        
        # Clean up the files after processing
        try:
            os.remove(left_pdf_path)
            os.remove(right_pdf_path)
        except:
            pass  # Ignore cleanup errors
        
        return {
            "left_text": left_text,
            "right_text": right_text
        }
            
    except Exception as e:
        # Clean up files in case of error
        try:
            if 'left_pdf_path' in locals():
                os.remove(left_pdf_path)
            if 'right_pdf_path' in locals():
                os.remove(right_pdf_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Error processing PDFs: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)