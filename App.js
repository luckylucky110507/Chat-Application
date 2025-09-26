import React, { useState } from "react";
import "./App.css";

export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! 👋", sender: "bot" },
    { id: 2, text: "Hi there! How are you?", sender: "user" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;
    setMessages([...messages, { id: Date.now(), text: input, sender: "user" }]);
    setInput("");
  };

  return (
    <div className="app-container">
      <div className="chat-box">
        {/* Header */}
        <div className="chat-header">Chat App</div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sender === "user" ? "user" : "bot"}`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}
