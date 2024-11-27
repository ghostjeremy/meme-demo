export const API_BASE_URL = '/api';
export const API_URL_OPENAI = (participantId, taskId) => `${API_BASE_URL}/users/${participantId}/tasks/${taskId}/chats/messages`;
export const API_URL_JSON_ASSISTANT = (participantId, taskId) => `${API_BASE_URL}/users/${participantId}/tasks/${taskId}/chats/json`;

export const ACTIONS = {
  START_TIMER: 'start_timer',
  STOP_TIMER: 'stop_timer',
};

export const STORAGE_KEYS = Object.freeze({
  PARTICIPANT_ID: 'participantId',
  TIMER_END: 'timerEndTime',
});

export const TIMER_DURATIONS = {
  GENERATE_IDEAS: 5 * 60 * 1000,
  GENERATE_IDEAS_MIN: 4 * 60 * 1000,
  PICK_FAVORITES: 2 * 60 * 1000,
  GENERATE_IMAGES: 5 * 60 * 1000,
};

export const QUALTRICS_URL = (participantId) => `https://migroup.qualtrics.com/jfe/form/SV_0BTV7dkGkxZw8HI?participant-id=${participantId}`;