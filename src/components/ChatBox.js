import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatBox.css';

const ChatBox = ({ chatHistory, value, setValue, processPrompt, loading, error, setError, disabled }) => { // 添加 taskType 参数
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && !disabled) {
      processPrompt();
    }
  };

  return (
    <div className="chat-box">
      <h3>Chatbot</h3>
      <div className="chat-container" ref={chatContainerRef}>
        {chatHistory.map((chat, index) => (
          <div key={index} className="chat-message">
            <div className="message-row question">
              <img
                src="/question-avatar.png"
                alt="Question Avatar"
                className="avatar"
              />
              <div className="message-content">
                <p><strong>{chat.message}</strong></p>
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
        <div className={ loading ? 'loading-indicator' : 'loading-indicator hidden' }></div>
      </div>
      <div className="input-container">
        <input
          value={value}
          placeholder={`Enter your message...`} // 动态占位符
          onChange={e => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading || disabled}
        />
        <button className="btn" onClick={processPrompt} disabled={loading || disabled}>
          {loading ? 'Sending...' : 'Send'} {/* 动态按钮文本 */}
        </button>
      </div>
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

export default ChatBox;