from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pdfminer.high_level import extract_text
import os
from typing import List

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

@app.post("/api/convert")
async def convert_pdfs(left_file: UploadFile = File(...), right_file: UploadFile = File(...)):
    if not left_file.filename.lower().endswith('.pdf') or not right_file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Process left file
        left_content = await left_file.read()
        left_pdf_path = f"uploads/{left_file.filename}"
        with open(left_pdf_path, "wb") as buffer:
            buffer.write(left_content)
        left_text = extract_text(left_pdf_path)
        
        # Process right file
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