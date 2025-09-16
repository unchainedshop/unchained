import { ChatMessage, ChatStatus } from '../types';

export const chatUtils = {
  /**
   * Create an interruption message
   */
  createInterruptionMessage(currentStatus: ChatStatus): ChatMessage {
    const statusMessages = {
      submitted: 'request processing',
      streaming: 'response generation',
      error: 'error handling',
      ready: 'idle state',
    };

    return {
      id: `interruption-${Date.now()}`,
      role: 'assistant',
      content: `⚠️ **Operation Interrupted**\n\nThe current operation was stopped by user request.\n\n**Status at interruption:**\n- Current phase: ${statusMessages[currentStatus] || currentStatus}\n- Remaining tasks may not have been completed\n- You can start a new request at any time\n\n*The system is ready for your next command.*`,
    };
  },

  /**
   * Check if a message has incomplete tool invocations
   */
  hasIncompleteToolInvocations(message: ChatMessage): boolean {
    if (message.role === 'assistant' && message.parts) {
      return message.parts.some(
        (part: any) =>
          part.type === 'tool-invocation' &&
          part.toolInvocation &&
          (!part.toolInvocation.result || part.toolInvocation.state === 'call'),
      );
    }
    return false;
  },

  /**
   * Filter out messages with incomplete tool invocations
   */
  filterCompleteMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages.filter(
      (message) => !this.hasIncompleteToolInvocations(message),
    );
  },
};
