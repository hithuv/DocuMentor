// We now import Request and Response types from express
import express, { Request, Response, Application } from 'express';
import Groq from 'groq-sdk';
import 'dotenv/config';
import multer from 'multer';
import pdf from 'pdf-parse';

//Langchain Imports
import {FaissStore} from "@langchain/community/vectorstores/faiss";
import { HuggingFaceTransformersEmbeddings} from '@langchain/community/embeddings/huggingface_transformers';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from "@langchain/core/documents";

//App Setup
const app: Application = express();
const PORT: number = 3000;
app.use(express.json());

//Tell Multer to store the uploaded file in RAM as a buffer, instead of disk.
const upload = multer({storage: multer.memoryStorage()});

//Groq AI Client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

//RAG Pipeline Components
let vectorStore: FaissStore | null = null;

//embedding model: runs locally inside our container.
//Model 'Xenova/all-MiniLM-L6-v2' prettty lightweight
const embeddings = new HuggingFaceTransformersEmbeddings({
    model: 'Xenova/all-MiniLM-L6-v2',
});


// Add types to the request and response parameters
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ 
        message: "Server ready to chat with GRoq!",
        vectorStore: !!vectorStore
    });
});

app.post('/api/ingest', upload.single('file'),async (req: Request, res: Response) => {

  if(!req.file){
    return res.status(400).json({error: 'No file uploaded'});
  }

  try{
    console.log('--- Starting Ingestion from file ---');
    // const text = req.file.buffer.toString('utf-8');
    let text: string;

    if(req.file.mimetype === 'application/pdf'){
      console.log('Parsing PDF file...');
      const pdfData = await pdf(req.file.buffer);
      text = pdfData.text;
    }
    else if (req.file.mimetype === 'text/plain'){
      console.log('Parsing text file...');
      text = req.file.buffer.toString('utf-8');
    }
    else{
      return res.status(400).json({error: 'Unsupported file type. Please upload a .txt or .pdf file.'});
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await textSplitter.splitDocuments([
      new Document({pageContent: text}),
    ]);
    console.log(`Text Split into ${docs.length} chunks.`);

    console.log(`Creating vector store...`);
    vectorStore = await FaissStore.fromDocuments(docs, embeddings);
    console.log('--- Ingestion complete. Vector Store is ready. ---');

    res.status(200).json({message: `Success! Ingested ${docs.length} document chunks`});
  }
  catch (error) {
    console.error('Ingestion Error', error);
    res.status(500).json({error: 'Failed to ingest document'});
  }
});

// The AI chat route
app.post('/api/chat', async (req: Request, res: Response) => {
    const { prompt } = req.body;
  
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
  
    try {
      console.log(`Received prompt: "${prompt}"`);
      
      if (!vectorStore) {
        return res.status(400).json({ error: 'No documents have been ingested yet. Please ingest documents first.' });
      }
      
      const relevantDocs = await vectorStore.similaritySearch(prompt, 4);
      console.log(`${relevantDocs.length} relevant documents found.`);

      const context = relevantDocs.map(doc => doc.pageContent).join('\n\n---\n\n');

      const augmentedPrompt = `
        You are a helpful AI assistant. Answer the user's question based ONLY on the following context.
        If the context doesn't contain the answer, say "I do not have enough information to answer that."

        CONTEXT:
        ${context}

        USER'S QUESTION:
        ${prompt}
      `;
      console.log('Sending augmented request to Groq...');
  
      // Make the API call to Groq
      const completion = await groq.chat.completions.create({
        // The messages array is how you structure the conversation
        messages: [
          {
            role: 'user',
            content: augmentedPrompt,
          },
        ],
        // This is a powerful but lightweight model hosted by Groq
        model: 'llama3-8b-8192',
      });
  
      console.log('Received response from Groq.');
      const responseMessage = completion.choices[0]?.message?.content || 'Sorry, I could not get a response.';
      
      res.status(200).json({ response: responseMessage, context: relevantDocs });
  
    } catch (error) {
      console.error('Error calling Groq API:', error);
      res.status(500).json({ error: 'Failed to get response from AI' });
    }
  });
  

app.listen(PORT, () => {
  console.log(`Server is running successfully on http://localhost:${PORT}`);
});