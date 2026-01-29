# DocLedger - Enterprise Document Intelligence Platform

DocLedger is an AI-powered document management and search platform with RAG (Retrieval-Augmented Generation) capabilities.

## Features

- 🤖 **AI-Powered Document Search** - Semantic search using pgvector and embeddings
- 📊 **Advanced Analytics** - Track user engagement, popular queries, and document usage  
- 👥 **Multi-tenant Architecture** - Organization-based isolation and management
- 🔐 **Role-Based Access Control** - Admin, Team Lead, and Member permissions
- 💬 **Real-time Chat Interface** - Interactive Q&A with your documents
- 📈 **Usage Dashboard** - Insights into trending topics and document popularity
- 🔍 **Chat History** - Track all conversations and responses

## Tech Stack

### Frontend
- React + TypeScript + Vite
- TailwindCSS + shadcn/ui
- React Query (TanStack Query)
- Zustand (State Management)

### Backend  
- Node.js + Express + TypeScript
- PostgreSQL with pgvector
- Azure Blob Storage
- Hugging Face API (Embeddings)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ with pgvector extension
- Azure Storage Account (or local file storage)
- Hugging Face API Key

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/DocLedger.git
cd DocLedger
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
