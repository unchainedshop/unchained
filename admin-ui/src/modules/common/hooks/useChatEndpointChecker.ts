import { useState, useEffect } from 'react';

export function useChatEndpointChecker() {
  const [loading, setLoading] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(false);

  useEffect(() => {
    const checkChatEndpoint = async () => {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_CHAT_URL || '/chat', {
          method: 'OPTIONS',
        });
        setChatEnabled(res.ok);
      } catch {
        setChatEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkChatEndpoint();
  }, []);

  return { chatEnabled, loading };
}
