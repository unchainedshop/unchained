import '@formatjs/intl-pluralrules/polyfill';

import '@formatjs/intl-relativetimeformat/polyfill';
import { IntlProvider } from 'react-intl';
import { useState, useEffect } from 'react';
import getMessages from '../utils/getMessages';
import useLocalStorage from '../../common/hooks/useLocalStorage';

const IntlWrapper = ({
  children,
  locale: initialLocale,
  messages: initialMessages,
}) => {
  const [locale, setLocale] = useState(initialLocale);
  const [messages, setMessages] = useState(initialMessages);
  const [preferredLanguage] = useLocalStorage('preferred-language', locale);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (preferredLanguage) {
        setLocale(preferredLanguage);
        setMessages(getMessages(preferredLanguage));
      }
    }
  }, [locale]);

  return (
    <IntlProvider
      onError={() => {}}
      locale={locale}
      messages={messages}
      textComponent="span"
    >
      {children}
    </IntlProvider>
  );
};

export default IntlWrapper;
