import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SortedIdeaListComponent.css';
import { useUser } from '../UserContext';
import { API_BASE_URL, TIMER_DURATIONS } from '../constants';
import { Timer } from './Timer';


const SortedIdeaListComponent = ({ ideas, setIdeas, setTask }) => {
  const location = useLocation();
  const { task } = location.state;

  const { userId } = useUser();
  const navigate = useNavigate();

  const [ isDisabled, setIsDisabled ] = useState(false);


  const handleCheckboxChange = async (idea) => {
    try {

      const res = await fetch(`${API_BASE_URL}/users/${userId}/tasks/${task.index}/ideas/${idea.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...idea, favourite: !Boolean(idea.favourite) }),
      });
      const updatedIdea = await res.json();

      setIdeas(ideas.map((i) => i.id === idea.id ? updatedIdea : i));
    } catch (e) {
      // Do nothing
    }
  };


  const handleConfirm = async () => {
    try {
      if (!task.timers.generateImages) {
        task.timers.generateImages = Number(new Date()) + TIMER_DURATIONS.GENERATE_IMAGES;
        setTask(task);
      }

      navigate(`/memes/images`, { state: { userId, task } });
    } catch (err) {
      console.error('Error saving best ideas:', err);
    }
  };


  const sortIdeas = (ideas) => ideas
    .slice()
    .sort((a, b) => {
      if (a.liked === b.liked) {
        return new Date(b.time) - new Date(a.time);
      }
      return a.liked ? -1 : 1;
    });


  const countFavs = (ideas) => ideas.filter(({ favourite }) => favourite).length


  const onTimeout = () => {
    // Timeout is necessary to avoid React issue
    setTimeout(() => setIsDisabled(true), 100);
  };


  return (
    <div className="sorted-idea-list-page">
      <p className="card">Out of all the generated ideas, please select which three you like best.</p>
      <main className="card">
        {sortIdeas(ideas).map((idea, index) => (
          <label key={index} className={idea.favourite ? "sorted-idea-item selected" : "sorted-idea-item"}>
            <input
              type="checkbox"
              checked={Boolean(idea.favourite)}
              onChange={() => handleCheckboxChange(idea)}
              disabled={isDisabled || (!idea.favourite && ideas.filter(({ favourite }) => favourite).length >= 3)}
            />
            <span className="sorted-idea-text">
              {idea.text} <br />
              <small>{idea.time}</small>
            </span>
            <span className={`sorted-idea-like-indicator ${idea.liked ? 'sorted-idea-liked' : ''}`}>
              {idea.liked ? '❤️' : '🤍'}
            </span>
          </label>
        ))}
      </main>
      <Timer
        endTime={task && task.timers && task.timers.pickFavorites}
        running={true}
        onTimeout={onTimeout}
      />
      <div className="navigation">

        <button className="btn" onClick={handleConfirm} disabled={ideas.length < 3 ? countFavs(ideas) !== ideas.length : countFavs(ideas) < 3 }>
          Confirm
        </button>
      </div>
    </div>
  );
};

export default SortedIdeaListComponent;