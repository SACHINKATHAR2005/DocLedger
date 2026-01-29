# DocLedger - Enterprise Document Intelligence Platform

> AI-powered document management and search platform with RAG (Retrieval-Augmented Generation) capabilities

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)

## 🚀 Features

- **🤖 AI-Powered Search** - Semantic document search using vector embeddings and pgvector
- **📊 Advanced Analytics** - Track user engagement, popular queries, trending topics, and document usage
- **👥 Multi-tenant Architecture** - Complete organization-based isolation with role-based access control
- **🔐 Role-Based Permissions** - Admin, Team Lead, and Member roles with granular permissions
- **💬 Interactive Chat** - Real-time Q&A interface with your documents
- **📈 Usage Dashboard** - Comprehensive insights into team activity and document popularity
- **🔍 Chat History** - Complete conversation tracking with source attribution
- **📁 Document Management** - Upload, process, and organize documents with automatic text extraction
- **🎯 Smart Chunking** - Intelligent document segmentation for optimal retrieval

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible components
- **React Query (TanStack Query)** - Powerful data synchronization
- **Zustand** - Lightweight state management
- **Axios** - Promise-based HTTP client

### Backend
- **Node.js 20+** with Express
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL 14+** - Relational database
- **pgvector** - Vector similarity search extension
- **Azure Blob Storage** - Cloud file storage
- **Hugging Face API** - Text embeddings (sentence-transformers)
- **JWT** - Secure authentication
- **Multer** - File upload handling

## 📋 Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14+ with pgvector extension
- Azure Storage Account (or configure local storage)
- Hugging Face API Key (free tier available)
- npm or yarn package manager

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/DocLedger.git
cd DocLedger
```

### 2. Setup Database

```sql
-- Create database
CREATE DATABASE docledger;

-- Create user
CREATE USER docledger_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE docledger TO docledger_user;

-- Enable pgvector extension
\c docledger
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Environment Variables (server/.env):**
```env
NODE_ENV=development
PORT=8000

# Database
DATABASE_URL=postgresql://docledger_user:your_password@localhost:5432/docledger

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_STORAGE_CONTAINER_NAME=documents

# Hugging Face API
HUGGINGFACE_API_KEY=your_api_key

# JWT Secret
JWT_SECRET=your_super_secret_key_change_this_in_production

# CORS
CORS_ORIGIN=http://localhost:5173
```

```bash
# Run migrations (create tables)
# Import the SQL schemas from server/database/

# Start development server
npm run dev
```

### 4. Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env
nano .env
```

**Environment Variables (client/.env):**
```env
VITE_API_URL=http://localhost:8000
```

```bash
# Start development server
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## 📚 Project Structure

```
DocLedger/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # API client, utilities
│   │   ├── store/         # Zustand stores
│   │   └── types/         # TypeScript types
│   └── package.json
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API routes
│   │   ├── service/      # Business logic
│   │   ├── middleware/   # Auth, upload, etc.
│   │   ├── config/       # Configuration
│   │   └── utils/        # Helper functions
│   ├── database/         # SQL schemas
│   └── package.json
│
└── README.md
```

## 🎯 Key Features Explained

### 1. RAG (Retrieval-Augmented Generation)
- Documents are chunked into semantic segments
- Text is converted to 384-dimensional embeddings
- Vector similarity search finds relevant content
- AI generates contextual answers with source attribution

### 2. Advanced Analytics
- **Frequent Questions**: Tracks most-asked queries
- **Trending Topics**: Keyword frequency analysis
- **Document Usage**: Most referenced documents
- **Activity Timeline**: 30-day usage patterns
- **User Engagement**: Per-user statistics

### 3. Role-Based Access Control
- **Admin**: Full system access, analytics, user management
- **Team Lead**: Team analytics, member oversight
- **Member**: Personal chat history, document access

### 4. Document Processing Pipeline
1. File upload (PDF, DOCX, TXT)
2. Text extraction
3. Intelligent chunking (512 tokens with overlap)
4. Embedding generation (Hugging Face API)
5. Vector storage in PostgreSQL
6. Full-text search indexing

## 🔒 Security Features

- JWT-based authentication
- Bcrypt password hashing
- SQL injection prevention (parameterized queries)
- CORS configuration
- File upload validation
- Role-based route protection
- Environment variable security

## 🚢 Deployment

### Production Build

```bash
# Backend
cd server
npm run build
npm start

# Frontend
cd client
npm run build
# Serve the dist/ folder with nginx or similar
```

### Recommended Hosting
- **Frontend**: Vercel, Netlify, or Azure Static Web Apps
- **Backend**: DigitalOcean, AWS EC2, or Azure App Service
- **Database**: Managed PostgreSQL (Azure, AWS RDS, DigitalOcean)
- **Storage**: Azure Blob Storage or AWS S3

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Organizations
- `POST /api/orgs/create` - Create organization
- `GET /api/orgs` - List user's organizations
- `GET /api/orgs/:orgId` - Get organization details
- `GET /api/orgs/members/:orgId` - Get members
- `POST /api/orgs/add-member/:orgId` - Add member

### Documents
- `POST /api/orgs/:orgId/documents/upload` - Upload document
- `GET /api/orgs/:orgId/documents` - List documents
- `POST /api/orgs/:orgId/documents/:docId/process` - Process document

### Chat & RAG
- `POST /api/orgs/:orgId/chat` - Send chat message
- `GET /api/orgs/:orgId/conversations` - Get conversations
- `GET /api/orgs/:orgId/chat-history` - Get user's chat history
- `GET /api/orgs/:orgId/chat-analytics` - Get analytics (admin)
- `GET /api/orgs/:orgId/chat-analytics/advanced` - Advanced analytics

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Your Name - [@yourhandle](https://github.com/SACHINKATHAR2005)

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface.co/) - Embedding models
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [TanStack Query](https://tanstack.com/query) - Data synchronization

## 📧 Support

For support, email support@docledger.com or open an issue in this repository.

---

**Built with ❤️ using TypeScript, React, and Node.js**
