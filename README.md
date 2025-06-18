# DocuMentor

DocuMentor is a full-stack, containerized **Retrieval Augmented Generation (RAG)** application. It allows users to upload their own documents and make conversation with a LLM that uses the document content. I also let it answer questions not from the context, but in that case it says : 'I think ...'. So you know it is not answered from the context.

---

## Core Concept: RAG Pipeline

The workflow is as follows:

1.  **Ingest:** An uploaded document is parsed and its text content is extracted.
2.  **Chunk:** The text is split into smaller, semantically meaningful chunks.
3.  **Embed:** Each chunk is converted into a numerical vector representation using a local Transformer model. These embeddings capture the semantic meaning of the text.
4.  **Store:** The embeddings are stored and indexed in a high-performance FAISS vector store for efficient similarity searching.
5.  **Retrieve:** When a user asks a question, the question is also embedded, and the FAISS store is queried to find the most semantically relevant document chunks.
6.  **Augment & Generate:** The retrieved chunks (the context) are prepended to the user's original question and sent to a powerful cloud-hosted LLM. The LLM is instructed to answer the question based *only* on the provided context.

---

## Architecture Diagram

```
+------------------+      +---------------------+      +---------------------+      +---------------------+
|      User      |----->|   Frontend (React)  |----->|  Backend (Node.js)  |----->|      Groq API     |
| (Browser @ 5173) |      |   (Nginx @ 80)      |      |  (Express @ 3000)   |      | (Llama 3 LLM)     |
+------------------+      +----------+----------+      +----------+----------+      +---------------------+
                                     |                         |
                                     | (API Calls /api/*)      | (RAG Pipeline)
                                     |                         |
                                     |                         v
                                     |                +-----------------+
                                     +--------------->|  Vector Store   |
                                                      | (FAISS on Disk) |
                                                      +-----------------+
```

---

## Tech Stack

| Category           | Technology                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Frontend** | [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)       |
| **Backend** | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/) |
| **AI / RAG** | [LangChain](https://www.langchain.com/), [Groq API](https://groq.com/) (Llama 3), [FAISS](https://faiss.ai/), [Hugging Face Embeddings](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) |
| **DevOps & Infra** | [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/), [Nginx](https://www.nginx.com/), [AWS EC2](https://aws.amazon.com/ec2/) |

---

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:
* [Node.js](https://nodejs.org/en/download/) (v18 or later)
* [Docker](https://www.docker.com/products/docker-desktop/) & Docker Compose
* [Git](https://git-scm.com/downloads)

---

## Local Setup & Installation

Follow these steps to get the application running on your local machine.

### 1. Clone the Repository
```bash
git clone https://github.com/hithuv/DocuMentor.git
cd DocuMentor
```

### 2. Install Dependencies
This project is a monorepo. You need to install dependencies for both the frontend and backend.

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Variables
The backend requires an API key from [Groq](https://groq.com/) to access the LLM.

1.  Navigate to the `backend` directory: `cd ../backend`
2.  Create an environment file: `touch .env`
3.  Open the new `.env` file and add your Groq API key:
    ```.env
    GROQ_API_KEY=gsk_YourSecretKeyFromGroqHere
    ```

### 4. Running the Application
The entire full-stack application is orchestrated with Docker Compose.

From the **root `DocuMentor` directory**, run the following command:
```bash
docker-compose up --build
```
This command will:
1.  Build the Docker images for both the `frontend` and `backend` services.
2.  Start both containers and connect them on a shared network.
3.  Mount the `vector_store` directory for persistent storage.

Once startup is complete:
* The **Frontend UI** will be accessible at `http://localhost:5173`.
* The **Backend API** will be accessible at `http://localhost:3000`.

### 5. How to Use
1.  Open your browser to `http://localhost:5173`.
2.  Use the "Ingest a Document" section to upload a `.txt` or `.pdf` file.
3.  Once ingestion is complete, use the "Chat with Your Document" section to ask questions about the content of the file you just uploaded.

---

## Project Structure

The project uses a monorepo structure to keep the frontend and backend code separate but within the same repository.

```
/
├── backend/            # Contains the Node.js, Express, and LangChain backend
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── frontend/           # Contains the React, Vite, and Nginx frontend
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── vector_store/       # (Auto-generated) Stores the persistent FAISS index
└── docker-compose.yml  # The master file that orchestrates both services
```
