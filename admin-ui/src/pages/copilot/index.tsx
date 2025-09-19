import React, { useEffect } from 'react';
import { ChatProvider } from '../../modules/copilot';
import { Copilot } from '../../modules/copilot/components';
import { useApolloClient } from '@apollo/client/react';

const HomePage: React.FC = () => {
  const client = useApolloClient();

  useEffect(() => {
    return () => {
      client.cache.reset();
    };
  }, [client]);
  return (
    <ChatProvider>
      <Copilot />
    </ChatProvider>
  );
};

export default HomePage;
