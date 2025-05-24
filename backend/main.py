from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pdfminer.high_level import extract_text
import os
from typing import List

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories if they don't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("texts", exist_ok=True)

@app.post("/api/convert")
async def convert_pdfs(pdfs: List[UploadFile] = File(...)):
    if len(pdfs) > 2:
        raise HTTPException(status_code=400, detail="Maximum 2 PDF files allowed")
    
    results = []
    
    for pdf in pdfs:
        if not pdf.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Save PDF file
        pdf_path = f"uploads/{pdf.filename}"
        with open(pdf_path, "wb") as buffer:
            content = await pdf.read()
            buffer.write(content)
        
        try:
            # Convert PDF to text
            text = extract_text(pdf_path)
            
            # Save text file
            text_filename = pdf.filename.replace('.pdf', '.txt')
            text_path = f"texts/{text_filename}"
            with open(text_path, "w", encoding="utf-8") as f:
                f.write(text)
            
            results.append({
                "originalName": pdf.filename,
                "textFilename": text_filename,
                "textContent": text,
                "size": len(content)
            })
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
        
    return {"success": True, "results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)