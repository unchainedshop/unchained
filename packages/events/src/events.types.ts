export type ContextNormalizerFunction = (context: any) => any;

export interface EmitAdapter {
  publish(eventName: string, payload: Record<string, unknown>): void;
  subscribe(
    eventName: string,
    callBack: (payload?: Record<string, unknown>) => void
  ): void;
}

export interface EventDirectorType {
  emit: (
    eventName: string,
    data?: string | Record<string, unknown>
  ) => Promise<void>;
  getEmitAdapter: () => EmitAdapter;
  getEmitHistoryAdapter: () => EmitAdapter;
  getRegisteredEvents: () => string[];
  registerEvents: (events: string[]) => void;
  setContextNormalizer: (fn: ContextNormalizerFunction) => void;
  setEmitAdapter: (adapter: EmitAdapter) => void;
  setEmitHistoryAdapter: (adapter: EmitAdapter) => void;
  subscribe: (
    eventName: string,
    callBack: (payload?: Record<string, unknown>) => void
  ) => void;
}
