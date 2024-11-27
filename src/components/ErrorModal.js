// src/components/ErrorModal.js
import React from 'react';

const ErrorModal = ({ error, setError }) => (
  error && (
    <div className="error-modal">
      <div className="error-content">
        <p>{error}</p>
        <button onClick={() => setError("")}>Close</button>
      </div>
    </div>
  )
);

export default ErrorModal;