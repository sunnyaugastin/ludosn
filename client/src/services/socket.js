import { io } from 'socket.io-client';

// Load the backend socket server URL from env or default to localhost:3000
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Connect manually on demand
  transports: ['websocket'],
  withCredentials: true
});
