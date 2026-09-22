import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import AuthContextProvider from "./context/AuthContext.tsx";
import SocketContextProvider from "./context/SocketContext.tsx";
import AnnouncementContextProvider from "./context/AnnouncementContext.tsx";
import ErrorBoundary from "./components/common/ErrorBoundary.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthContextProvider>
        <SocketContextProvider>
          <AnnouncementContextProvider>
            <App />
          </AnnouncementContextProvider>
        </SocketContextProvider>
      </AuthContextProvider>
    </ErrorBoundary>
  </StrictMode>,
);
