import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

export default function PhoneSupportTab() {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'hr',
      text: 'Hello! Welcome to HR Support. How can we assist you today?',
      time: '12:00 PM'
    }
  ]);
  const chatEndRef = useRef(null);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: chatInput,
      time: timeString
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // Simulate HR auto reply
    setTimeout(() => {
      const hrReply = {
        id: Date.now() + 1,
        sender: 'hr',
        text: 'Thank you for contacting HR Support. We have received your query regarding attendance/claims and will get back to you shortly.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, hrReply]);
    }, 8000);
  };

  return (
    <div className="phone-tab-screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="phone-screen-header" style={{ marginBottom: '0.75rem' }}>
        <h2 className="phone-screen-title">Support</h2>
      </div>

      {/* Chat Window */}
      <div className="chat-window animate-fade">
        <div className="chat-messages-container">
          {chatMessages.map(msg => (
            <div 
              key={msg.id} 
              className={`chat-bubble chat-bubble-${msg.sender === 'hr' ? 'received' : 'sent'}`}
            >
              <div>{msg.text}</div>
              <div style={{ fontSize: '0.55rem', opacity: 0.7, textAlign: 'right', marginTop: '0.2rem' }}>
                {msg.time}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendChatMessage} className="chat-input-wrapper">
          <input 
            type="text" 
            className="chat-input" 
            placeholder="Type your message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button 
            type="submit" 
            style={{ border: 'none', background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
