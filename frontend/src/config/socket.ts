import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./axios";

const socket: Socket = io(
  API_BASE_URL,
  {
    autoConnect: false,
    withCredentials: true,
  }
);

export const connectSocket = (token: string) => {
  socket.auth = { token };
  if (socket.connected) {
    socket.disconnect();
  }
  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
