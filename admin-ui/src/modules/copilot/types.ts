export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts?: any[];
  [key: string]: any;
}

export interface ChatContextType {
  messages: ChatMessage[];
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    attachments?: string[],
  ) => void;
  error: any;
  clearHistory: () => void;
  stop: () => void;
  addInterruptionMessage: (currentStatus: string) => void;
  status: 'error' | 'submitted' | 'streaming' | 'ready';

  sendMessage: (param: { text: string }) => void;
  reload: () => void;
}

export type ChatStatus = 'error' | 'submitted' | 'streaming' | 'ready';
