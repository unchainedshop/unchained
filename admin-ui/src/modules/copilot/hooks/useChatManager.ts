import { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { useIntl } from 'react-intl';

import { chatUtils } from '../utils/chatUtils';
import useLocalStorage from '../../common/hooks/useLocalStorage';
import { ChatStatus, DefaultChatTransport, UIMessage } from 'ai';
import { ChatMessage } from '../types';

function formatFileLink(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];

  return imageExtensions.includes(extension)
    ? `![image](${url})`
    : `[${url.split('/').pop() || 'file'}](${url})`;
}

export const useChatManager = () => {
  const intl = useIntl();
  const [chatHistory, setChatHistory] = useLocalStorage(
    'copilot-chat-history',
    [],
  );

  const hasInitialized = useRef(false);
  const {
    messages,
    error,
    resumeStream,
    status,
    setMessages,
    stop,
    regenerate: reload,
    sendMessage,
  } = useChat({
    transport: new DefaultChatTransport({
      api: process.env.NEXT_PUBLIC_CHAT_URL || '/chat',
      credentials: 'include',
    }),
    messages: chatHistory,
    onError: (error) => {
      let errorContent = '';
      const chatUrl = process.env.NEXT_PUBLIC_CHAT_URL || '/chat';

      if (
        error.message?.includes('401') ||
        error.message?.includes('invalid_token') ||
        error.message?.includes('Unauthorized')
      ) {
        errorContent = intl.formatMessage({
          id: 'chat.error.auth',
          defaultMessage:
            '🔐 **Authentication Error**\n\nYour session has expired or the authentication token is invalid.\n\n**To fix this:**\n1. Refresh the page (Ctrl+R / Cmd+R)\n2. Log out and log back in\n3. Check your permissions\n\n*This happens when your session expires after being idle too long.*',
        });
      } else if (
        error.message?.includes('fetch') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError')
      ) {
        errorContent = intl.formatMessage(
          {
            id: 'chat.error.connection',
            defaultMessage:
              '🚫 **Connection Error**\n\nCannot connect to the chat API server at {chatUrl}.\n\n**To enable chat:**\n1. Start the backend\n2. Ensure chat/MCP endpoint is configured\n3. Check NEXT_PUBLIC_CHAT_URL\n\n**Current configuration:**\n- Chat URL: {chatUrl}\n\n*Please start the backend.*',
          },
          { chatUrl },
        );
      } else if (
        error.message?.includes('stream') ||
        error.message?.includes('process')
      ) {
        errorContent = intl.formatMessage(
          {
            id: 'chat.error.stream',
            defaultMessage:
              '⚠️ **Stream Processing Error**\n\nThere was an error processing the AI response stream.\n\n**Possible causes:**\n1. Backend not running\n2. MCP server not responding\n3. Missing/invalid API keys\n4. Network issues\n\n**Error details:** {details}',
          },
          { details: error.message },
        );
      } else {
        errorContent = intl.formatMessage(
          {
            id: 'chat.error.unexpected',
            defaultMessage:
              '❌ **Chat Error**\n\nAn unexpected error occurred: {details}\n\n*Please try again or check the console for details.*',
          },
          { details: error.message },
        );
      }

      const errorMessage: UIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        parts: [{ type: 'text', text: errorContent }],
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  useEffect(() => {
    if (status === 'streaming') return;
    setChatHistory(messages as ChatMessage[]);
  }, [status]);

  const clearHistory = () => {
    setMessages([]);
    setChatHistory([]);
    hasInitialized.current = false;
  };

  const addInterruptionMessage = (currentStatus: ChatStatus) => {
    const interruptionMessage =
      chatUtils.createInterruptionMessage(currentStatus);
    setMessages((prev) => [...prev, interruptionMessage as UIMessage]);
  };

  const handleSubmit = async (inputText: string, imageUrls?: string[]) => {
    try {
      const assets = imageUrls?.map(formatFileLink).join('\n') ?? '';
      const messageContent = [inputText, assets].filter(Boolean).join('\n');

      if (inputText) {
        sendMessage({ text: messageContent });
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      const localizedError =
        errorMessage.includes('401') || errorMessage.includes('Unauthorized')
          ? intl.formatMessage({
            id: 'chat.error.auth',
            defaultMessage:
              '🔐 **Authentication Error**\n\nYour session has expired or the authentication token is invalid.\n\n*Please refresh or log in again.*',
          })
          : intl.formatMessage(
            {
              id: 'chat.error.submission',
              defaultMessage:
                '❌ **Submission Error**\n\nFailed to send your message.\n\n**Error:** {details}\n\n*Please ensure the backend is running.*',
            },
            { details: errorMessage },
          );

      const chatError: UIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        parts: [{ type: 'text', text: localizedError }],
      };

      setMessages((prev) => [...prev, chatError]);
    }
  };
  return {
    messages,
    handleSubmit,
    error,
    status,
    clearHistory,
    stop,
    addInterruptionMessage,
    sendMessage,
    reload,
    resumeStream,
  };
};
