import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import useCurrentUser from '../../accounts/hooks/useCurrentUser';
import { useChatContext } from '..';
import { LoadingIndicator } from '.';
import CopilotHeader from './CopilotHeader';
import CopilotInput from './CopilotInput';
import { useChatEndpointChecker } from '../../common/hooks/useChatEndpointChecker';
import { useAvailableTools } from '../hooks/useAvailableTools';
import CopilotEmptyState from './CopilotEmptyState';
import CopilotMessageList from './CopilotMessageList';
import CopilotErrorState from './CopilotErrorState';

const Copilot = () => {
  const { formatMessage } = useIntl();
  const chatContext = useChatContext();
  const { messages, status, reload, sendMessage } = chatContext;
  const { chatEnabled } = useChatEndpointChecker();
  const { currentUser } = useCurrentUser();
  const {
    groupedTools,
    loading: toolsLoading,
    error: toolsError,
  } = useAvailableTools();
  const bottomRef = useRef<HTMLDivElement>(null);
  const loading = status !== 'ready' && status !== 'error';
  const [showTools, setShowTools] = useState(false);

  const handleIntroduction = async () => {
    const introMessage = formatMessage({
      id: 'copilot-into-message',
      defaultMessage:
        'Hello! Please introduce yourself and explain what you can help me with in managing my Unchained Commerce store. Be friendly and informative about your current capabilities.',
    });

    try {
      sendMessage({ text: introMessage });
    } catch (error) {
      console.error('Failed to append introduction:', error);
    }
  };

  useLayoutEffect(() => {
    const el = bottomRef.current;
    if (!el || !messages || messages.length === 0) return;

    const id = requestAnimationFrame(() => {
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return () => {
      if (id) {
        cancelAnimationFrame(id);
      }
    };
  }, [messages.length]);

  const visibleMessages = useMemo(() => {
    if (!Array.isArray(messages)) return [];
    return messages.filter((message) => {
      if (
        message.role === 'assistant' &&
        (!message.parts ||
          message.parts.length === 0 ||
          (message.parts[0]?.type === 'text' && !message.parts[0]?.text))
      )
        return false;
      if (message.id === 'intro-message') return false;
      return true;
    });
  }, [messages]);
  if (!chatEnabled) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
        <div className="py-16 text-center">
          <h1 className="text-4xl font-extrabold text-rose-900 dark:text-rose-200">
            {formatMessage({
              id: 'chat_disabled_title',
              defaultMessage: 'Chat is Disabled',
            })}
          </h1>
          <p className="mt-2 text-base text-slate-500 dark:text-slate-200">
            {formatMessage({
              id: 'chat_disabled_message',
              defaultMessage:
                'Copilot chat is currently disabled in this shop. Please check your engine configuration',
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <CopilotHeader />
      <main className="flex-1 overflow-y-auto py-6 space-y-4 max-w-4xl mx-auto w-full px-4">
        {messages.length === 0 && !loading ? (
          <CopilotEmptyState onIntroClick={handleIntroduction} />
        ) : (
          <CopilotMessageList
            messages={visibleMessages}
            loading={loading}
            currentUser={currentUser}
            showTools={showTools}
            toggleShowTools={() => setShowTools((s) => !s)}
            groupedTools={groupedTools}
            toolsLoading={toolsLoading}
            toolsError={toolsError}
          />
        )}
        {status === 'error' && <CopilotErrorState onRetry={reload} />}
        {loading && <LoadingIndicator />}
        <div
          ref={bottomRef}
          className={messages.length > 0 || loading ? 'pb-6' : ''}
        />
      </main>
      <CopilotInput />
    </div>
  );
};

export default Copilot;
