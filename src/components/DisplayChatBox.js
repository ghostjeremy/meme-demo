import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatBox.css';

const DisplayChatBox = ({ chatHistory, loading, error, setError }) => {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="chat-box">
      <h2>LLM Parser</h2>
      <div className="chat-container" ref={chatContainerRef}>
        {chatHistory.map((chat, index) => (
          <div key={index} className="chat-message">
            <div className="message-row">
              <img
                src="/question-avatar.png"
                alt="Question Avatar"
                className="avatar"
              />
              <div className="message-content">
                <p className="question"><strong>{chat.message}</strong></p>
              </div>
            </div>
            <div className="message-row">
              <img
                src="/answer-avatar.png"
                alt="Answer Avatar"
                className="avatar"
              />
              <div className="message-content answer-content">
                <ReactMarkdown>{chat.response}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>
      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}
      {error && (
        <div className="error-modal">
          <div className="error-content">
            <p>{error}</p>
            <button onClick={() => setError("")}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisplayChatBox;