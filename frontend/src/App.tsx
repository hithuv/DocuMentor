import React, { useState, useRef } from 'react';
import './App.css';

// Define the structure for a chat message
interface Message {
  sender: 'user' | 'ai';
  text: string;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleIngest = async () => {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }

    setLoading(true);
    setMessages([{ sender: 'ai', text: `Ingesting ${selectedFile.name}...` }]);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // NOTE: This will fail for now because we're running on a different port than the backend
      // We will fix this with Docker Compose and Nginx proxy later.
      const response = await fetch('http://localhost:3000/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File ingestion failed.');
      }

      const data = await response.json();
      setMessages([{ sender: 'ai', text: data.message }]);
    } catch (error) {
      console.error(error);
      setMessages([{ sender: 'ai', text: 'An error occurred during ingestion.' }]);
    } finally {
      setLoading(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFile(null);
    }
  };

  const handleChat = async () => {
    if (!prompt.trim()) return;

    const newMessages: Message[] = [...messages, { sender: 'user', text: prompt }];
    setMessages(newMessages);
    setLoading(true);
    setPrompt('');

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error('Chat API request failed.');
      }

      const data = await response.json();
      setMessages([...newMessages, { sender: 'ai', text: data.response }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { sender: 'ai', text: 'Sorry, something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📄 DocuMentor</h1>
        <p>Your AI-Powered Document Assistant</p>
      </header>
      
      <main className="App-main">
        <div className="ingest-section">
          <h2>1. Ingest a Document</h2>
          <p>Upload a .txt or .pdf file to give the AI context.</p>
          <div className="file-upload-area">
            <input type="file" onChange={handleFileChange} ref={fileInputRef} accept=".txt,.pdf" />
            <button onClick={handleIngest} disabled={!selectedFile || loading}>
              {loading ? 'Ingesting...' : 'Ingest File'}
            </button>
          </div>
        </div>

        <div className="chat-section">
          <h2>2. Chat with Your Document</h2>
          <div className="chat-window">
            {messages.length === 0 && (
              <div className="chat-placeholder">
                <p>Your conversation will appear here.</p>
                <p>Start by ingesting a document.</p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>
          <div className="chat-input-area">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChat()}
              placeholder="Ask a question about your document..."
              disabled={loading}
            />
            <button onClick={handleChat} disabled={!prompt || loading}>
              {loading ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;