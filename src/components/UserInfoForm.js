import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from '../UserContext';
import { API_BASE_URL, STORAGE_KEYS } from "../constants";
import "./UserInfoForm.css";

const UserInfoForm = () => {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const { setUserId } = useUser();
  const navigate = useNavigate();
  const locationObj = useLocation();
  const [participantId, setParticipantId] = useState(null);

  useEffect(() => {
    // Retrieve participantId
    const participantIdFromSessionStorage = sessionStorage.getItem(STORAGE_KEYS.PARTICIPANT_ID);
    // No participant ID? Back to the beginning for receving one!
    if (!participantIdFromSessionStorage) {
      return navigate('/');
    }

    setParticipantId(participantIdFromSessionStorage);
    setUserId(participantIdFromSessionStorage); // Set the userId in context
  }, [ locationObj, setUserId, navigate ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userInfo = { age, gender, location };

    try {
      const response = await fetch(`${API_BASE_URL}/users/${participantId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userInfo),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        setAge('');
        setGender('');
        setLocation('');
        navigate("/task1/home", { state: { taskType: 'task1' } });
      } else {
        setMessage("Failed to submit user info.");
      }
    } catch (error) {
      console.error("Error submitting user info:", error);
      setMessage("An error occurred while submitting user info.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="user-info-form">
      <div>
        <label>Age:</label>
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Gender:</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          required
        >
          <option value="">Select...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label>Location:</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
      </div>
      <button type="submit">Submit</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default UserInfoForm;