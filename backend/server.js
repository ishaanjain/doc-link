import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Configure CORS to allow requests from the frontend
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow only PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create texts directory if it doesn't exist
const textsDir = path.join(__dirname, 'texts');
if (!fs.existsSync(textsDir)) {
  fs.mkdirSync(textsDir, { recursive: true });
}

// Helper function to convert PDF to text
async function convertPdfToText(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error converting PDF to text:', error);
    throw error;
  }
}

// Endpoint to handle PDF uploads and conversion
app.post('/api/convert', upload.array('pdfs', 2), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];

    for (const file of req.files) {
      // Convert PDF to text
      const text = await convertPdfToText(file.path);
      
      // Save text to file
      const textFilename = path.basename(file.filename, '.pdf') + '.txt';
      const textPath = path.join(textsDir, textFilename);
      fs.writeFileSync(textPath, text);
      
      // Add result to array
      results.push({
        originalName: file.originalname,
        textFilename: textFilename,
        textContent: text,
        size: file.size
      });
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({ error: 'Failed to process PDF files', message: error.message });
  }
});

// Endpoint to get a specific text file
app.get('/api/texts/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(textsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Text file not found' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});