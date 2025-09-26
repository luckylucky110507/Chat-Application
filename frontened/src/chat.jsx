import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export default function Chat({ name, room }) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingText, setTypingText] = useState("");
  const [text, setText] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

  useEffect(() => {
    const socket = io(SERVER, { transports: ['websocket'] });
    socketRef.current = socket;

    
    socket.emit('join', { name, room });

    
    socket.on('history', (history) => {
      setMessages(history);
    });

    
    socket.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    
    socket.on('user-list', (list) => setUsers(list));

  
    socket.on('typing', ({ name: who }) => setTypingText(`${who} is typing...`));
    socket.on('stop-typing', () => setTypingText(""));

    
    return () => {
      socket.disconnect();
    };
  }, [name, room]);

  
  useEffect(() => {
    if (!typingText) return;
    const timeout = setTimeout(() => setTypingText(""), 2000);
    return () => clearTimeout(timeout);
  }, [typingText]);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;

    socketRef.current.emit('message', { text, sender: name, room });
    setText("");
    socketRef.current.emit('stop-typing', { name, room });
  }

  function onChange(e) {
    setText(e.target.value);
    socketRef.current.emit('typing', { name, room });
  }

  return (
    <div className="chat-root">
      <div className="sidebar">
        <h3>Room: {room}</h3>
        <h4>Users</h4>
        <ul>
          {users.map(u => <li key={u}>{u}</li>)}
        </ul>
      </div>

      <div className="chat-viewport">
        <div className="messages">
          {messages.map(m => (
            <div key={m.id || m.ts} className={`message ${m.sender === name ? 'me' : ''}`}>
              <div className="meta">
                <strong>{m.sender}</strong>
                <span className="time">
                  {m.ts ? new Date(m.ts).toLocaleTimeString() : ""}
                </span>
              </div>
              <div className="text">{m.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>

        <div className="typing">{typingText}</div>

        <form className="composer" onSubmit={sendMessage}>
          <input
            value={text}
            onChange={onChange}
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
