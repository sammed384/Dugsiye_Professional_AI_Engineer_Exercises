# RAG Document Chat Setup

## Required Dependencies

Install the following packages:

```bash
# MongoDB driver
npm install mongodb

# Radix UI components
npm install @radix-ui/react-scroll-area @radix-ui/react-separator
```

## Environment Variables

Copy `.env.template` to `.env.local` and fill in your values:

```bash
cp env.template .env.local
```

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `PINECONE_API_KEY`: Your Pinecone API key  
- `PINECONE_ENVIRONMENT`: Your Pinecone environment
- `PINECONE_INDEX_NAME`: Your Pinecone index name (default: rag-documents)
- `MONGODB_URI`: Your MongoDB connection string

## MongoDB Setup

### Option 1: Local MongoDB
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Option 2: MongoDB Atlas
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env.local`

## Features

✅ **Document Upload & Processing**
- Upload PDF, DOCX, TXT, MD files
- Automatic text extraction and chunking
- Vector embeddings stored in Pinecone
- Document metadata stored in MongoDB

✅ **Document Management**
- View all uploaded documents
- Track processing status
- Delete documents (removes from both MongoDB and Pinecone)

✅ **Chat Interface**
- Select multiple documents to chat with
- Real-time streaming responses
- Context-aware answers based on document content
- Session management

## Usage

1. **Upload Documents**: Use the Upload tab to add your documents
2. **Wait for Processing**: Documents need to be processed before chatting
3. **Start Chatting**: Switch to Chat tab, select documents, and ask questions

## Architecture

- **Frontend**: Next.js 15 with React 19
- **UI**: Tailwind CSS + shadcn/ui components  
- **Database**: MongoDB for document metadata and chat history
- **Vector Store**: Pinecone for document embeddings
- **AI**: OpenAI GPT-4o for chat, text-embedding-3-small for embeddings
- **Document Processing**: LangChain loaders for reliable text extraction
