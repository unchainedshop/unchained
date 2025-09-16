import React from 'react';
import { ChatProvider } from '../../modules/copilot';
import { Copilot } from '../../modules/copilot/components';

const HomePage: React.FC = () => {
  return (
    <ChatProvider>
      <Copilot />
    </ChatProvider>
  );
};

export default HomePage;
