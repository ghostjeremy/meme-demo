import { React, useState } from 'react';
import './IdeaListComponent.css';
import { API_BASE_URL } from '../constants';

const IdeaListComponent = ({ userId, ideas, setIdeas, disabled, task, loading }) => {
  const [newIdeaText, setNewIdeaText] = useState('');

  const handleSave = () => {
    if (newIdeaText.trim()) {
      saveIdea({ text: newIdeaText })
        .then((newIdea) => ideas.push(newIdea))
        .then(() => setNewIdeaText(''));
    }
  };


  // const handleDelete = async (idea) => {
  //   try {
  //     await fetch(`${API_BASE_URL}/users/${userId}/ideas/${idea.id}`, {
  //       method: 'DELETE',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     });
  //   } catch (err) {
  //     console.error("Error saving idea to server:", err);
  //   }
  // };


  const handleLike = (idea) => {
    const updatedIdea = { ...idea };
    updatedIdea.liked = !updatedIdea.liked;
    saveIdea(updatedIdea)
      .then((receivedIdea) => Object.assign(idea, receivedIdea))
      .then(() => setIdeas(ideas.slice()));
  };


  const saveIdea = async (idea) => {
    try {
      const url = idea.id ? `${API_BASE_URL}/users/${userId}/tasks/${task.index}/ideas/${idea.id}` :
        `${API_BASE_URL}/users/${userId}/tasks/${task.index}/ideas`;
      return fetch(url, {
        method: idea.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(idea),
      })
        .then((res) => res.json());
    } catch (err) {
      console.error("Error saving idea to server:", err);
    }
  };


  return (
    <div className="idea-list-container">
      <div className="idea-list-title">
        <h3>Idea List</h3>
      </div>
      <div className="idea-list-note">
        <small>This is an overview of generated ideas. You can mark ideas as favorites for later.</small>
      </div>
      <div className="idea-list">
        {ideas.map((idea, index) => (
          <div key={index} className="idea-item">
            <button onClick={() => handleLike(idea)} className="like-button" disabled={disabled}>
              {idea.liked ? '❤️' : '🤍'}
            </button>
            <span className="idea-text">
              {idea.text} <br />
              <small>{idea.time}</small>
            </span>
          </div>
        ))}
      </div>
      <div className={ loading ? 'loading-indicator' : 'loading-indicator hidden' }></div>
      <div className="input-container">
        <input
          type="text"
          value={newIdeaText}
          onChange={(e) => setNewIdeaText(e.target.value)}
          placeholder="Enter your own ideas..."
          className="idea-input"
          disabled={disabled}
        />
        <button onClick={handleSave} className="idea-save-button btn" disabled={disabled}>
          Save
        </button>
      </div>
    </div>
  );
};

export default IdeaListComponent;