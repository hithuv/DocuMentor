import express, { Request, Response } from 'express';

// Define the port number. Use the environment variable if available, otherwise default to 3000.
const PORT = process.env.PORT || 3000;

// Create an instance of an Express application
const app = express();

// Define a route handler for GET requests to the root URL ('/')
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Hello, DocuMentor Pro!' });
});

// Start the server and listen for incoming connections on the specified port
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});