import React, { useState } from 'react';
import { Heart, Send, Bell } from 'lucide-react';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hello! I'm your MediSync AI health assistant. How can I help you today?" }
  ]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const botMsg = { role: 'bot', text: "I received your message: " + input };
    setMessages(prev => [...prev, botMsg]);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcfdff', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '16px', 
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              background: 'linear-gradient(to right, #3b82f6, #a855f7)', 
              padding: '14px', 
              borderRadius: '12px',
              color: 'white'
            }}>
              <Heart size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>MediSync AI</h1>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Patient Advocate</p>
            </div>
          </div>
          <button style={{ padding: '10px', borderRadius: '50%', border: 'none', background: '#f1f5f9' }}>
            <Bell size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '24px', 
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          height: '500px'
        }}>
          <div style={{ 
            background: 'linear-gradient(to right, #2563eb, #7c3aed)', 
            color: 'white', 
            padding: '20px', 
            borderRadius: '16px 16px 0 0',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Health Consultation</h2>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>AI Powered Assistant</p>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '12px'
              }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '12px',
                  borderRadius: '16px',
                  backgroundColor: msg.role === 'user' ? '#3b82f6' : '#f8fafc',
                  color: msg.role === 'user' ? 'white' : 'black'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about your health..."
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                background: 'linear-gradient(to right, #3b82f6, #a855f7)',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
