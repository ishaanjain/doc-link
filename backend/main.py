from fastapi import FastAPI, File, UploadFile, HTTPException, Form
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
        
        # Parse the JSON string to return actual array, fallback to empty array
        try:
            import json
            parsed_requirements = json.loads(requirements_json)
            # Ensure it's a list
            if not isinstance(parsed_requirements, list):
                parsed_requirements = []
        except (json.JSONDecodeError, TypeError):
            # Fallback to empty array if parsing fails
            parsed_requirements = []
        
        # Clean up the file after processing
        try:
            os.remove(pdf_path)
        except:
            pass  # Ignore cleanup errors
        
        return {"requirements": parsed_requirements}
            
    except Exception as e:
        # Clean up file in case of error
        try:
            if 'pdf_path' in locals():
                os.remove(pdf_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/api/match-requirements")
async def match_requirements(file: UploadFile = File(...), requirements_json: str = Form(None)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        content = await file.read()
        pdf_path = f"uploads/{file.filename}"
        with open(pdf_path, "wb") as buffer:
            buffer.write(content)
        
        # Use dummy requirements_json if not provided
        if requirements_json is None:
            requirements_json = '''[
                {
                "requirement": "Ensure CubeSat compatibility with standardized dispensers for safe and reliable deployment",
                "req_file_txt": "The CubeSat Design Specification Rev. 14.1 outlines mechanical and electrical specifications, such as rail dimensions, deployment switch requirements, and separation mechanisms, to ensure CubeSats are compatible with rail-based or tab-based dispensers for safe integration and deployment."
                },
                {
                "requirement": "Minimize orbital debris and ensure safe operation of CubeSats during launch and on-orbit phases",
                "req_file_txt": "The specification mandates compliance with NPR 8715.6B for limiting orbital debris, requiring components to re-enter with less than 15 Joules of energy, and includes operational specifications like a 30-minute delay for deployable activation and 45-minute delay for RF transmission to ensure safe operation."
                }
            ]'''
        
        # Load and encode the PDF for Claude
        with open(pdf_path, "rb") as f:
            pdf_data = base64.b64encode(f.read()).decode("utf-8")
        
        # Use Claude to match requirements against the formal spec PDF
        response = anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": "application/pdf",
                                "data": pdf_data
                            }
                        },
                        {
                            "type": "text",
                            "text": f"""Please analyze this formal specification PDF and match each requirement from this JSON list to exact text from the PDF. Return a JSON array where each element is an object with this structure:
{{
  "requirement": "<original requirement text>",
  "matched_text": "<exact matching text from PDF or empty string if no match>",
  "confidence": "<high|medium|low based on match quality>"
}}

JSON requirements:
{requirements_json}

Return only the JSON array, no additional text or formatting."""
                        }
                    ]
                }
            ],
        )
        
        # Parse the JSON response from Claude
        try:
            import json
            matched_requirements = json.loads(response.content[0].text)
            # Ensure it's a list
            if not isinstance(matched_requirements, list):
                matched_requirements = []
        except (json.JSONDecodeError, TypeError):
            # Fallback to empty array if parsing fails
            matched_requirements = []
        
        # Clean up the file after processing
        try:
            os.remove(pdf_path)
        except:
            pass  # Ignore cleanup errors
        
        return {"matched_requirements": matched_requirements}
            
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