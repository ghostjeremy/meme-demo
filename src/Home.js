import React, { useState, useEffect, useCallback } from "react";
import "./Home.css";
import ChatBox from './components/ChatBox';
import IdeaListComponent from './components/IdeaListComponent';
import EditableIdeaListComponent from './components/EditableIdeaListComponent';
import TaskComponent from './components/TaskComponent';
import { useUser } from './UserContext';
import { useFetcher, useNavigate } from "react-router-dom";
import {
  API_URL_OPENAI,
  API_URL_JSON_ASSISTANT,
  API_BASE_URL,
  TIMER_DURATIONS,
} from "./constants";
import Timer from "./components/Timer";


const Home = ({ ideas, setIdeas, task, setTask }) => {
  const navigate = useNavigate();
  const { userId } = useUser();

  const [ primaryChatHistory, setPrimaryChatHistory ] = useState([ ]);
  const [ chatInputValue, setChatInputValue ] = useState("");
  const [ chatError, setChatError ] = useState("");
  const [ chatLoading, setChatLoading ] = useState(false);

  const [auxiliaryChatHistory, setAuxiliaryChatHistory] = useState([ ]);
  const [auxiliaryError, setAuxiliaryError] = useState("");

  const [ideasLoading, setIdeasLoading] = useState(false);

  const [isDisabled, setIsDisabled] = useState(false);

  const [isTimerActive, setIsTimerActive] = useState(true);
  const [ minTimeReached, setMinTimeReached ] = useState(false);


  useEffect(() => {
    if (!userId) {
      return navigate('/');
    }
  }, [ userId, navigate ]);


  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!userId || !task) {
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}/tasks/${task.index}/chats/messages`);
        if (res.ok) {
          const retrievedChatHistory = await res.json();
          setPrimaryChatHistory(retrievedChatHistory);
        } else {
          setChatError('Failed to retrieve chat history. Please reload the page or contact us if the error persists.');
          console.error("Failed to fetch chat history");
        }
      } catch (err) {
        setChatError('Failed to retrieve chat history. Please reload the page or contact us if the error persists.');
        console.error("Error fetching chat history:", err);
      }
    };

    fetchChatHistory();
  }, [ setPrimaryChatHistory, navigate, userId, task ]);

  useEffect(() => {
    const fetchIdeas = async () => {
      if (!userId || !task) {
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}/tasks/${task.index}/ideas/`);
        if (res.ok) {
          const ideas = await res.json();
          setIdeas(ideas);
        } else {
          setChatError('Failed to retrieve the list of ideas. Please reload the page or contact us if the error persists.');
          console.error("Failed to fetch ideas");
        }
      } catch (err) {
        setChatError('Failed to retrieve the list of ideas. Please reload the page or contact us if the error persists.');
        console.error("Error fetching ideas:", err);
      }
    };

    fetchIdeas();
  }, [ setIdeas, navigate, userId, task ]);


  useEffect(() => {
    const fetchTask = async () => {
      if (!userId) {
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}/tasks?next`);
        if (res.ok) {
          const nextTask = await res.json();
          if (!nextTask) {
            return navigate('/thank-you');
          }

          if (!nextTask.timers.generateIdeas) {
            nextTask.timers.generateIdeas = Number(new Date()) + TIMER_DURATIONS.GENERATE_IDEAS;
          }
          setTask(nextTask);
          console.log("Fetched task:", nextTask);

        } else {
          setChatError('Failed to retrieve the current task description. Please reload the page or contact us if the error persists.');
          console.error("Failed to fetch task");
        }
      } catch (err) {
        setChatError('Failed to retrieve the current task description. Please reload the page or contact us if the error persists.');
        console.error("Error fetching task:", err);
      }
    }
    fetchTask();
  }, [ userId, navigate, setTask ]);

  useEffect(() => {
    if (!task) {
      return;
    }
    setIsTimerActive(true);
    setIsDisabled(false);
  }, [ task ])


  const handleTimeout = () => {
    setTimeout(() => setIsTimerActive(false), 100);
    setTimeout(() => setIsDisabled(true), 100);
  };

  const promptLLM = async (value, setValue, setChatHistory, setError, setChatLoading) => {
    setAuxiliaryError('');

    if (!value) {
      return setAuxiliaryError('Please enter a message first!');
    }

    try {
      setChatLoading(true);
      const options = {
        method: "POST",
        body: JSON.stringify({ message: value, userId  }),
        headers: {
          "Content-Type": "application/json",
        },
      };

      const res = await fetch(API_URL_OPENAI(userId, task.index), options);
      if (!res.ok) {
        throw new Error(`Failed to fetch from ${API_URL_OPENAI(userId, task.index)}, status: ${res.status}`);
      }

      const data = await res.json();
      const newChatEntry = { message: value, response: data.response };
      setChatHistory((prevChatHistory) => [ ...prevChatHistory, newChatEntry ]);
      setValue('');

      setTimeout(async () => {
        try {
          setIdeasLoading(true);
          const jsonAssistantOptions = {
            method: "POST",
            body: JSON.stringify({ message: data.response }),
            headers: {
              "Content-Type": "application/json",
            },
          };

          const resJsonAssistant = await fetch(API_URL_JSON_ASSISTANT(userId, task.index), jsonAssistantOptions);

          if (!resJsonAssistant.ok) {
            console.error(`Failed to fetch from ${API_URL_JSON_ASSISTANT(userId, task.index)}, status: ${resJsonAssistant.status}`);
            setError('Idea could not be processed.');
          }

          const dataJsonAssistant = await resJsonAssistant.json();
          const newAssistantChatEntry = { message: data.response, response: dataJsonAssistant.response };

          setAuxiliaryChatHistory((prevChatHistory) => [...prevChatHistory, newAssistantChatEntry]);

          const parsedIdea = JSON.parse(dataJsonAssistant.response);

          if (parsedIdea && parsedIdea.memes && Array.isArray(parsedIdea.memes)) {
            const newIdeas = parsedIdea.memes.map(meme => ({
              text: meme.text,
              time: new Date().toLocaleString(),
              liked: false,
            }));



            for (let idea of newIdeas) {
              await fetch(`${API_BASE_URL}/users/${userId}/tasks/${task.index}/ideas`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(idea),
              })
                .then((res) => res.json())
                .then((addedIdea) => ideas.push(addedIdea));
            }
          }

        } catch (err) {
          console.error(err);
          setAuxiliaryError(`Failed to analyze text: ${err.message}`);
        } finally {
          setIdeasLoading(false);  // 请求完成后取消加载状态
        }
      }, 1000);

    } catch (err) {
      console.error(err);
      setError(`Failed to analyze text: ${err.message}`);
    } finally {
      setChatLoading(false);
    }
  };

  // const handleLogout = async () => {
  //   try {
  //     await fetch('http://localhost:8000/clearAllData', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ userId }),
  //     });

  //     // 清空前端的状态
  //     setChatHistory1([]);
  //     setChatHistory2([]);
  //     setIdeas([]);
  //     setThreadId1(null);
  //     setThreadId2(null);
  //     setUserId(null);

  //     const taskTypes = ['task1', 'task2', 'task3']; // 假设你有这三个任务类型

  //     taskTypes.forEach(type => {
  //       localStorage.removeItem(`${type}_timerEndTime`);
  //       localStorage.removeItem(`${type}_isDisabled`);
  //     });

  //     navigate("/");
  //   } catch (error) {
  //     console.error('Error logging out:', error);
  //   }
  // };


  const handleNextStep = () => {
    if (!task.timers.pickFavorites) {
      task.timers.pickFavorites = Number(new Date()) + TIMER_DURATIONS.PICK_FAVORITES;
      setTask(task);
    }

    setIsTimerActive(false);
    navigate(`/memes/ideas`, { state: { task, ideas, userId } });
  };

  const handleTick = (timeRemaining) => {
    setMinTimeReached(timeRemaining < TIMER_DURATIONS.GENERATE_IDEAS - TIMER_DURATIONS.GENERATE_IDEAS_MIN);
  };

  return (
    <div className="app">

      { (!isTimerActive && ideas.length < 3) ?
        <p className="warn">You have created fewer than three captions in the scheduled five minutes. Please contact us directly if you wish to still participate in this study.</p>
      : <></> }

      <div>
        <div className="box leftbox">
          <TaskComponent task={task} />
        </div>

        {
          task && !task.isBaseline &&
          <div className="box midbox">
            <ChatBox
              chatHistory={primaryChatHistory}
              value={chatInputValue}
              setValue={setChatInputValue}
              processPrompt={() => promptLLM(chatInputValue, setChatInputValue, setPrimaryChatHistory, setChatError, setChatLoading)}
              loading={chatLoading}
              error={chatError}
              setError={setChatError}
              disabled={chatLoading || isDisabled}  // 禁用发送按钮
            />
          </div>
        }

            {/*
            <div style={{ display: 'none' }} className="box">
              <DisplayChatBox
                chatHistory={auxiliaryChatHistory}
                loading={ideasLoading}
                error={auxiliaryError}
                setError={setAuxiliaryError}
              />
            </div> */}

        <div className="box midbox">
          {
            task && task.isBaseline ?
            <EditableIdeaListComponent
              userId={userId}
              task={task}
              ideas={ideas}
              setIdeas={setIdeas}
              disabled={isDisabled}
            /> :
            <IdeaListComponent userId={userId} ideas={ideas} task={task} setIdeas={setIdeas} disabled={isDisabled} loading={ideasLoading} />
          }
        </div>
      </div>
      <Timer
        endTime={task && task.timers && task.timers.generateIdeas}
        running={isTimerActive}
        onTick={handleTick}
        onTimeout={handleTimeout}
      />
      <div className="navigation">
        <button className="next-button btn" disabled={!minTimeReached || ideas.length < 3} onClick={handleNextStep}>Next Step</button>
      </div>
    </div>
  );

};

export default Home;