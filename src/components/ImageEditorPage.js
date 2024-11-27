import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import ImageEditorWrapper from './ImageEditorWrapper';
import './ImageEditorPage.css';
import { API_BASE_URL } from "../constants";
import Timer from "./Timer";

const ImageEditorPage = ({ ideas, task }) => {
  const [ bestIdeas, setBestIdeas ] = useState([]);
  const location = useLocation();
  const { userId } = location.state;
  const wrappersRef = useRef([]);
  const navigate = useNavigate();
  const [ isDisabled, setIsDisabled ] = useState(false);

  useEffect(() => {
    if (!task) {
      return;
    }

    const fetchBestIdeas = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}/tasks/${task.index}/ideas?favourites`);
        if (res.ok) {
          const ideas = await res.json();
          setBestIdeas(ideas);
        } else {
          console.error('Failed to fetch best ideas');
        }
      } catch (err) {
        console.error('Error fetching best ideas:', err);
      }
    };

    fetchBestIdeas();
  }, [userId, task ]);

  const handleDeselectAll = () => {
    wrappersRef.current.forEach(wrapperRef => {
      if (wrapperRef && wrapperRef.handleDeselect) {
        wrapperRef.handleDeselect();
      }
    });
  };

  const handleSaveToDatabase = async () => {
    const imagesData = wrappersRef.current.map(wrapperRef => wrapperRef.getImageData());

    try {
      await Promise.all(imagesData.map((img, imgIndex) =>
        fetch(`${API_BASE_URL}/users/${userId}/tasks/${task.index}/images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, images: [ img ], imgIndex }),
        })
          .then((res) => {
            if (res.ok) {
              console.log('Image saved successfully', task.index, imgIndex);
            } else {
              console.error('Failed to save image', task.index, imgIndex);
            }
          }),
      ));


      const updateTask = await fetch(`${API_BASE_URL}/users/${userId}/tasks/${task.index}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: true }),
      });

      if (!updateTask.ok) {
        throw new Error('Failed to complete task.');
      }

      navigate('/memes', { state: { task: null, ideas: [ ], userId }});

    } catch (err) {
      console.error('Error saving images:', err);
    }
  };

  const handleFinish = () => {
    handleDeselectAll();
    setTimeout(handleSaveToDatabase, 100); // 等待deselect完成，然后保存数据
  };

  const handleFinishClick = () => {
    if (window.confirm("Are you happy with your images and are ready to move to the next step?")) {
      handleFinish();
    }
  };

  const onTimeout = () => {
    // Timeout is necessary to avoid React issue
    setTimeout(() => setIsDisabled(true), 100);
  };


  return (
    <div>
      <div className="card">
        <h2>Image Editor</h2>
        <p>This page allows you to edit and customize images based on your selected captions. You can add text to images, adjust the text size, and reposition it. Double-clicking the text allows you to edit its content. Once you are done, click 'Finish' to save your work.</p>
      </div>

      <main className="editbox">
        <div className="image-editors-container">
          {bestIdeas.map((idea, index) => (
            <div className="image-editor-wrapper" key={index}>
              <ImageEditorWrapper
                ref={el => (wrappersRef.current[index] = el)}
                description={idea.text}
                task={task}
                disabled={isDisabled}
              />
            </div>
          ))}
        </div>
      </main>
      <Timer
        endTime={task && task.timers && task.timers.generateImages}
        running={true}
        onTimeout={onTimeout}
      />
      <div className="navigation">
        <button className="btn" onClick={handleFinishClick}>Finish</button>
      </div>
    </div>
  );
};

export default ImageEditorPage;