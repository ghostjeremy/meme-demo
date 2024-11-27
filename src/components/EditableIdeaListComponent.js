import React, { useState } from 'react';
import './EditableIdeaListComponent.css';
import { API_BASE_URL } from '../constants';

// TODO No update on clicking the heart

const EditableIdeaListComponent = ({ userId, ideas, setIdeas, disabled, task }) => {
  const [ newIdeaText, setNewIdeaText ] = useState('');
  const [ editableIdea, setEditableIdea ] = useState(null);
  const [ editableIdeaText, setEditableIdeaText ] = useState();

  const handleLike = (idea) => {
    const updatedIdea = { ...idea };
    updatedIdea.liked = !updatedIdea.liked;
    saveIdea(updatedIdea)
      .then((receivedIdea) => Object.assign(idea, receivedIdea));
  };


  const handleDelete = (idea) => {
    fetch(`${API_BASE_URL}/users/${userId}/tasks/${task.index}/ideas/${idea.id}`, {
      method: 'DELETE',
    })
      .then(() => setIdeas(ideas.filter(({ id }) => idea.id !== id)));
  };


  const setEditable = (idea) => {
    console.trace('setEditable', idea);
    setEditableIdea(idea);
    setEditableIdeaText(idea.text);
  };


  const saveEdit = (idea) => {
    console.trace('saveEdit', idea);
    const updatedIdea = { ...idea };
    updatedIdea.text = editableIdeaText;
    saveIdea(updatedIdea)
      .then((receivedIdea) => {
        Object.assign(idea, receivedIdea);
        setEditableIdea(null);
        setEditableIdeaText('');
      });
  };

  const handleAddIdea = () => {
    if (newIdeaText.trim()) {
      const newIdea = {
        text: newIdeaText.trim(),
        time: new Date().toLocaleString(),
        liked: false,
      };

      saveIdea(newIdea)
        .then((receivedIdea) => {
          setIdeas([ ...ideas, receivedIdea ]);
          setNewIdeaText('');
        });
    }
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
    <div className="editable-idea-list-container">
      <div className="idea-list-title">
        <h3>Idea List</h3>
      </div>
      <div className="idea-list">
        {ideas.map((idea, index) => (
          <div key={index} className="idea-item">
            <button onClick={() => handleLike(idea)} className="like-button" disabled={disabled}>
              {idea.liked ? '❤️' : '🤍'}
            </button>
            <span className="idea-text">
              {idea === editableIdea ? (
                <input
                  type="text"
                  value={editableIdeaText}
                  onChange={(e) => setEditableIdeaText(e.target.value)}
                  disabled={disabled}
                />
              ) : (
                <>
                  {idea.text}
                </>
              )}
            </span>
            {!disabled && (
              <>
                {idea === editableIdea ? (
                  <>
                    <button onClick={() => saveEdit(idea)} className="save-button" disabled={!Boolean(editableIdeaText)}>Save</button>
                    <button onClick={() => setEditableIdea(null)} className="cancel-button">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditable(idea)} disabled={disabled} className="edit-button">Edit</button>
                    <button onClick={() => handleDelete(idea)} disabled={disabled} className="delete-button">Delete</button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      {!disabled && (
        <div className="input-container">
          <input
            type="text"
            value={newIdeaText}
            onChange={(e) => setNewIdeaText(e.target.value)}
            placeholder="Enter your idea..."
            className="idea-input"
          />
          <button onClick={handleAddIdea} className="btn">Add Idea</button>
        </div>
      )}
    </div>
  );
};

export default EditableIdeaListComponent;