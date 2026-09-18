# ExamGen AI Pro — Backend

## Folder Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   ├── authController.js  # Register, Login, GetMe
│   └── documentController.js  # PDF upload & management
├── middleware/
│   ├── auth.js            # JWT protect middleware
│   ├── errorHandler.js    # Global error handler
│   └── upload.js          # Multer PDF upload config
├── models/
│   ├── User.js            # Student account
│   ├── Document.js        # Uploaded PDF metadata
│   ├── Test.js            # Generated exam
│   ├── Question.js        # Individual questions
│   ├── Result.js          # Exam attempt + evaluation
│   └── ProctorLog.js      # Proctoring violations
├── routes/
│   ├── auth.js            # /api/auth/*
│   └── documents.js       # /api/documents/*
├── uploads/               # PDF files stored here
├── .env.example           # Copy to .env and fill values
├── package.json
└── server.js              # Entry point
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create your .env file
```bash
cp .env.example .env
```
Fill in your MongoDB URI, JWT secret, and API keys.

### 3. Make sure MongoDB is running
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud) — paste the connection string in MONGO_URI
```

### 4. Start the server
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

## API Endpoints

### Auth
| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| POST | /api/auth/register | Register new student | No |
| POST | /api/auth/login | Login | No |
| GET | /api/auth/me | Get current user | Yes |

### Documents
| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| POST | /api/documents/upload | Upload PDF | Yes |
| GET | /api/documents | List all PDFs | Yes |
| GET | /api/documents/:id | Get single PDF | Yes |
| DELETE | /api/documents/:id | Delete PDF | Yes |

### Test (upcoming Phase 3)
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/tests/generate | Generate exam from PDF |
| GET | /api/tests | List user's tests |
| GET | /api/tests/:id | Get test with questions |
| POST | /api/results/submit | Submit exam answers |
| GET | /api/results/:id | Get evaluation result |

## Next Steps (Phase 2)
Add LangChain + ChromaDB for RAG:
```bash
npm install langchain @langchain/openai chromadb
```
Then build `services/ragService.js` to chunk text → embeddings → ChromaDB.
