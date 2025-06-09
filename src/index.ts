// We now import Request and Response types from express
import express, { Request, Response, Application } from 'express';
import Groq from 'groq-sdk';
import 'dotenv/config';

const app: Application = express();
const PORT: number = 3000;

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

app.use(express.json());

// Add types to the request and response parameters
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: "Server ready to chat with GRoq!" });
});

// The AI chat route
app.post('/api/chat', async (req: Request, res: Response) => {
    const { prompt } = req.body;
  
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
  
    try {
      console.log(`Received prompt: "${prompt}"`);
      console.log('Sending request to Groq...');
  
      // Make the API call to Groq
      const completion = await groq.chat.completions.create({
        // The messages array is how you structure the conversation
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        // This is a powerful but lightweight model hosted by Groq
        model: 'llama3-8b-8192',
      });
  
      console.log('Received response from Groq.');
      const responseMessage = completion.choices[0]?.message?.content || 'Sorry, I could not get a response.';
      
      res.status(200).json({ response: responseMessage });
  
    } catch (error) {
      console.error('Error calling Groq API:', error);
      res.status(500).json({ error: 'Failed to get response from AI' });
    }
  });
  

app.listen(PORT, () => {
  console.log(`Server is running successfully on http://localhost:${PORT}`);
});