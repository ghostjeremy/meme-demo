import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Home from './Home';
import UserInfoForm from './components/UserInfoForm';
import SortedIdeaListComponent from './components/SortedIdeaListComponent';
import ImageEditorPage from './components/ImageEditorPage';
import ConsentForm from './components/ConsentForm';
import ThankYouPage from './components/ThankYouPage';
import { UserProvider, useUser } from './UserContext'; // Import UserProvider
import { API_BASE_URL } from "./constants";

const App = () => {
  return (
    <UserProvider> {/* Wrap the Router with UserProvider */}
      <Router>
        <AppRoutes />
      </Router>
    </UserProvider>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  const { userId, setUserId } = useUser();
  const [ ideas, setIdeas ] = useState([ ]);
  const [ task, setTask ] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const participantId = params.get('participant_id');
    if (participantId) {
      setUserId(participantId);
      localStorage.setItem('userId', participantId);
    }
  }, [location, setUserId]);


  const saveTask = useCallback((task) => {
    fetch(`${API_BASE_URL}/users/${userId}/tasks/${task.index}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    setTask(task);
  }, [ userId ]);

  return (
    <div>
      <header>
        <h1>LLMeme</h1>
      </header>
      <Routes>
        <Route path="/" element={<ConsentForm />} />
        <Route path="/memes" element={<Home ideas={ideas} setIdeas={setIdeas} task={task} setTask={saveTask} />} />
        <Route path="/memes/ideas" element={<SortedIdeaListComponent ideas={ideas} setIdeas={setIdeas} setTask={saveTask} />} />
        <Route path="/memes/images" element={<ImageEditorPage ideas={ideas} task={task} />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
      </Routes>
      <footer>
        <a rel="noreferrer" target="_blank" href="https://www.medien.ifi.lmu.de/impressum.xhtml">Impressum</a>
        <a rel="noreferrer" target="_blank" href="https://www.medien.ifi.lmu.de/datenschutz.xhtml">Privacy Policy</a>
        <a rel="noreferrer" target="_blank" href="https://www.medien.ifi.lmu.de/kontakt.xhtml">Contact</a>
      </footer>
    </div>
  );
};

export default App;