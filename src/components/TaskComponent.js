import React from 'react';
import './TaskComponent.css';

const TaskComponent = ({ task }) => {
  if (!task) {
    return <div className="task-container">
      <p>No Task selected</p>
    </div>
  }

  return (
    <div className="task-container">
      <div className="task-title"><h3>Task</h3></div>
      <img
        src={task.image.url}
        alt={task.image.alt || ''}
        className="task-image"
      />
      {task.description.map((line, index) =>
        <p key={index} className={ line.highlight ? 'highlighted' : ''}>
          { line.text }
        </p>
      )}
    </div>
  );
};

export default TaskComponent;
