import React from 'react';
import { MessageRenderer } from '.';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ToolGrid from './ToolGrid';
import { IUser } from '../../../gql/types';
import { useIntl } from 'react-intl';
import { ChatMessage } from '../types';

const CopilotMessageList = ({
  messages,
  loading,
  currentUser,
  showTools,
  toggleShowTools,
  groupedTools,
  toolsLoading,
  toolsError,
}: {
  messages: ChatMessage[];
  loading: boolean;
  currentUser: IUser;
  showTools: boolean;
  toggleShowTools: () => void;
  groupedTools: any;
  toolsLoading: boolean;
  toolsError: any;
}) => {
  const { formatMessage } = useIntl();
  if (messages.length === 0) return null;
  return (
    <>
      {messages.map((message, index) => (
        <React.Fragment key={message.id}>
          <MessageRenderer message={message} user={currentUser} />
          {index === 0 && !loading && (
            <div className="py-4">
              <div className="mb-6">
                <button
                  onClick={toggleShowTools}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary bg-surface border border-border-default rounded-lg hover:bg-surface-raised transition-colors"
                >
                  {showTools ? (
                    <>
                      <ChevronUpIcon className="w-4 h-4" />
                      {formatMessage({
                        id: 'hide_available_tools',
                        defaultMessage: 'Hide Available Tools',
                      })}
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="w-4 h-4" />
                      {formatMessage({
                        id: 'show_available_tools',
                        defaultMessage: 'Show Available Tools',
                      })}
                    </>
                  )}
                </button>
              </div>
              {showTools && (
                <div className="mt-8">
                  <ToolGrid
                    groupedTools={groupedTools}
                    loading={toolsLoading}
                    error={toolsError}
                  />
                </div>
              )}
            </div>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default React.memo(CopilotMessageList);
