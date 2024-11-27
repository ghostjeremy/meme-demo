import React from 'react';
import './ThankYouPage.css';
import { QUALTRICS_URL } from '../constants';
import { useUser } from '../UserContext';

const ThankYouPage = () => {
  const { userId } = useUser();

  const handleRedirect = () => {
    window.location.href = QUALTRICS_URL(userId);
  };

  return (
    <div className="thank-you-container">
      <p>Thank you for completing the tasks</p>
      <p>Please continue to the survey by clicking the button below.</p>
      <button className="btn" onClick={handleRedirect}>To the survey</button>

      <p>You can download your generated images below.</p>
      <div className="image-grid">
        { new Array(3).fill(new Array(3).fill(null)).map((_, taskIndex) => _.map((_, imageIndex) =>
          <a href={`/images/${userId}/image-${taskIndex}-${imageIndex}.png`} download={`image-${taskIndex}-${imageIndex}.png`} key={`link-${taskIndex * 10 + imageIndex}`}>
            <img alt="generated meme" src={`/images/${userId}/image-${taskIndex}-${imageIndex}.png`} key={`img-${taskIndex * 10 + imageIndex}`} />
          </a>
        )).sort(() => Math.random() > 0.5 ? -1 : 1) }
      </div>
    </div>
  );
};

export default ThankYouPage;
