import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import socket, { connectSocket, disconnectSocket } from "../config/socket";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

const SocketContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectSocket(accessToken);
    } else {
      disconnectSocket();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsConnected(false);
    }
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
    };
    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsConnected(true);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used inside SocketContextProvider");
  }
  return context;
};

export default SocketContextProvider;
