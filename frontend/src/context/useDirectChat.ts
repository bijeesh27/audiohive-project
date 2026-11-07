import { useContext } from "react";
import { DirectChatContext } from "./directChatContextInstance";

export const useDirectChat = () => {
  const context = useContext(DirectChatContext);
  if (!context) {
    throw new Error("useDirectChat must be used inside DirectChatContextProvider");
  }
  return context;
};
