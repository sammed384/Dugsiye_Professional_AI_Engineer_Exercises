# RAG System - Features & Architecture

## Overview
A Retrieval-Augmented Generation (RAG) system that allows users to upload documents locally and chat with them using AI. The system processes documents, creates embeddings, and provides intelligent responses based on the document content.

## Tech Stack

### Core Technologies
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and development experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - UI component library

### AI & Vector Database
- **OpenAI** - Text embeddings (`text-embedding-3-small`) and chat completions (`gpt-4o`)
- **Pinecone** - Vector database for storing and querying embeddings
- **AI SDK** - Vercel's AI SDK for streamlined AI integration
- **Unstructured.io** - Document processing and chunking service

### File Processing
- **Local File Upload** - Drag & drop interface for document upload
- **Supported Formats** - PDF, DOCX, TXT, MD (extensible)
- **Client-side Processing** - Initial file handling before server processing

## Core Features

### 1. Document Upload & Processing
- **File Upload Interface**
  - Drag & drop file upload component
  - Multiple file selection support
  - File type validation and size limits
  - Upload progress indicators
  - File preview and management

- **Document Processing Pipeline**
  - Integration with Unstructured.io for document parsing
  - Intelligent text extraction from various formats
  - Metadata extraction (title, author, creation date)
  - Document chunking with configurable strategies

### 2. Embedding & Vector Storage
- **Text Chunking**
  - Use by title chunking that unstructured offers
  - Overlap strategy for context preservation
  - Semantic chunking for better coherence
  - Chunk metadata tracking

- **Embedding Generation**
  - OpenAI text-embedding-3-small model
  - Batch processing for efficiency
  - Error handling and retry logic
  - Progress tracking for large documents

- **Vector Database (Pinecone)**
  - Namespace organization by document/user
  - Metadata filtering capabilities
  - Similarity search with configurable thresholds
  - Index management and optimization

### 3. Chat Interface
- **Modern Chat UI**
  - Real-time streaming responses
  - Message history persistence
  - Typing indicators and loading states
  - Copy/share message functionality
  - Mobile-responsive design

- **RAG-Enhanced Responses**
  - Semantic search across document chunks
  - Source attribution with chunk references
  - Confidence scoring for retrieved content
  - Fallback to general knowledge when needed

### 4. Document Management
- **Document Library**
  - List view of uploaded documents
  - Document metadata display
  - Search and filter capabilities
  - Delete and re-process options
  - Storage usage tracking

- **Processing Status**
  - Real-time processing status updates
  - Error handling and retry mechanisms
  - Processing queue management
  - Batch operations support



## User Interface Components

### Layout & Navigation
- **Main Layout** - Sidebar navigation with document library
- **Header** - Upload button, settings, theme toggle
- **Footer** - Status indicators, usage metrics

### Document Upload
- **Upload Zone** - Drag & drop area with file browser fallback
- **File Preview** - Thumbnail and metadata display
- **Progress Tracker** - Upload and processing progress
- **Error Handling** - Clear error messages and retry options

### Chat Interface
- **Message List** - Scrollable chat history with source citations
- **Input Area** - Multi-line text input with send button
- **Typing Indicator** - Real-time response generation feedback
- **Message Actions** - Copy, regenerate, share options

### Document Management
- **Document Grid** - Card-based document display
- **Search Bar** - Filter documents by name or content
- **Document Details** - Metadata panel with processing info
- **Bulk Actions** - Select multiple documents for operations

## API Architecture

### Route Handlers
- **POST /api/upload** - Handle file uploads and initiate processing
- **POST /api/chat** - Stream chat responses with RAG integration
- **GET /api/documents** - Retrieve user's document library
- **DELETE /api/documents/[id]** - Remove document and embeddings
- **POST /api/process** - Trigger document reprocessing

### Server Actions
- **processDocument()** - Coordinate document processing pipeline
- **generateEmbeddings()** - Create and store document embeddings
- **searchSimilarContent()** - Query vector database for relevant chunks
- **manageDocuments()** - CRUD operations for document metadata

### External Integrations
- **Unstructured.io API** - Document parsing and chunking
- **OpenAI API** - Embeddings and chat completions
- **Pinecone API** - Vector storage and similarity search

## Configuration & Environment

### Environment Variables
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=rag-documents

# Unstructured.io Configuration
UNSTRUCTURED_API_KEY=your_unstructured_api_key
UNSTRUCTURED_API_URL=https://api.unstructured.io

# Application Configuration
MAX_FILE_SIZE=10MB
MAX_CHUNK_SIZE=1000
EMBEDDING_DIMENSIONS=1536
```

### Configuration Options
- **Chunking Strategy** - Sentence, paragraph, or semantic chunking
- **Embedding Model** - OpenAI model selection
- **Search Parameters** - Similarity threshold, result count


