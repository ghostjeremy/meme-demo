import { useEffect, useState } from "react";


export const Timer = ({ onTimeout, onTick, onStart, endTime, running }) => {
  const duration = endTime - Number(new Date());
  const [ timeRemaing, setTimeRemaining ] = useState(endTime ? duration : 0);

  useEffect(() => {
    setTimeRemaining(endTime - Number(new Date()));
  }, [ endTime ]);

  useEffect(() => {
    if (!endTime) {
      return;
    }

    const timeout = setTimeout(() => {
      if (running) {
        setTimeRemaining((t) => {
          if (t <= 0) {
            clearTimeout(timeout);
            if (onTimeout && typeof onTimeout === 'function') {
              onTimeout();
            }
            return 0;
          }

          if (onTick && typeof onTick === 'function') {
            onTick(timeRemaing);
          }
          return endTime - Number(new Date());
        });
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [ endTime, timeRemaing, onStart, onTick, onTimeout, running ]);


  const formattedTime = () => {
    if (!endTime) {
      return 'Time left: --:--';
    }
    const minutes = Math.floor(timeRemaing / 1000 / 60);
    const seconds = Math.floor(timeRemaing / 1000) % 60;
    return `Time left: ${minutes}:${ seconds < 10 ? '0' : ''}${seconds}`;
  }


  return <div className="timer">
    { formattedTime() }
  </div>
}

export default Timer;