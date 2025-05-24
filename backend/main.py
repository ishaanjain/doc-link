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
            pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
        
        # Request requirements extraction with structured output
        response = anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text", 
                        "text": """Extract all product verification requirements from this document and return them as a JSON array of objects. Each object should have exactly this structure:
{
  "requirement": "<LLM-generated clear, concise description of the requirement>",
  "req_file_txt": "<exact text from the source document that corresponds to this requirement>"
}

Focus on specific, testable requirements that can be verified. For each requirement:
1. Generate a clear, actionable description in the 'requirement' field
2. Include the exact verbatim text from the document in the 'req_file_txt' field

Return only the JSON array, no additional text or formatting."""
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

@app.post("/api/convert-requirements")
async def convert_to_requirements(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        content = await file.read()
        pdf_path = f"uploads/{file.filename}"
        with open(pdf_path, "wb") as buffer:
            buffer.write(content)
        
        # Extract requirements using Anthropic API
        requirements_json = await extract_requirements_with_anthropic(pdf_path)
        
        # Clean up the file after processing
        try:
            os.remove(pdf_path)
        except:
            pass  # Ignore cleanup errors
        
        return {"requirements": requirements_json}
            
    except Exception as e:
        # Clean up file in case of error
        try:
            if 'pdf_path' in locals():
                os.remove(pdf_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/api/convert-text")
async def convert_to_text(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        content = await file.read()
        pdf_path = f"uploads/{file.filename}"
        with open(pdf_path, "wb") as buffer:
            buffer.write(content)
        
        # Extract text using pdfminer
        text = extract_text(pdf_path)
        
        # Clean up the file after processing
        try:
            os.remove(pdf_path)
        except:
            pass  # Ignore cleanup errors
        
        return {"text": text}
            
    except Exception as e:
        # Clean up file in case of error
        try:
            if 'pdf_path' in locals():
                os.remove(pdf_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)