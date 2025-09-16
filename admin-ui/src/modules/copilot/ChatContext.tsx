import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { ChatContextType } from './types';
import { useChatManager } from './hooks/useChatManager';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const chatManager = useChatManager();

  const value: ChatContextType = useMemo(
    () =>
      ({
        messages: chatManager.messages,
        handleSubmit: chatManager.handleSubmit,
        error: chatManager.error,
        clearHistory: chatManager.clearHistory,
        stop: chatManager.stop,
        addInterruptionMessage: chatManager.addInterruptionMessage,
        status: chatManager.status,
        reload: chatManager.reload,
        sendMessage: chatManager.sendMessage,
        resumeStream: chatManager.resumeStream,
      }) as any,
    [
      chatManager.messages,
      chatManager.handleSubmit,
      chatManager.error,
      chatManager.clearHistory,
      chatManager.stop,
      chatManager.addInterruptionMessage,
      chatManager.status,
      chatManager.reload,
      chatManager.sendMessage,
      chatManager.resumeStream,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
