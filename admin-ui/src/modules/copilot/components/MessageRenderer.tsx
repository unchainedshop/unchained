import React from 'react';
import { IUser } from '../../../gql/types';
import MiniUserAvatar from '../../common/components/MiniUserAvatar';
import MarkdownText from './MarkdownText';
import ToolInvocationRenderer from './ToolInvocationRenderer';
import renderImage from './tool-renderers/imageRenderer';

interface MessageRendererProps {
  message: any;
  user: IUser;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ message, user }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {isUser && user && (
        <div className="flex-shrink-0 mr-2">
          <MiniUserAvatar showName={false} name={user.username} />
        </div>
      )}
      <div
        className={`${
          isUser
            ? 'bg-slate-200 dark:bg-slate-700 rounded-br-none rounded-xl max-w-md px-3 py-2'
            : 'text-slate-800 dark:text-slate-200 flex-1 max-w-full py-3 overflow-hidden'
        }`}
      >
        {message.parts.map((part: any, index: number) => {
          switch (part.type) {
            case 'text':
              return (
                <MarkdownText key={index} text={part.text} className="mb-0" />
              );

            case 'dynamic-tool':
              return <ToolInvocationRenderer key={index} part={part} />;

            case 'step-start':
              return null;

            case 'tool-generateImage':
              return (
                <ToolInvocationRenderer
                  key={index}
                  part={{
                    toolName: 'generateImage',
                    output: {
                      content: [{ text: part.output }],
                    },
                  }}
                />
              );

            case 'reasoning':
              return null;

            default:
              return (
                <div key={index} className="text-sm text-amber-600">
                  Unknown part: {JSON.stringify(part)}
                </div>
              );
          }
        })}
      </div>
    </div>
  );
};

export default MessageRenderer;
