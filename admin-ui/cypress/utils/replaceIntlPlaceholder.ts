const replaceIntlPlaceholder = (text, value, placeholder = 'label') => {
  return text.replaceAll(`{${placeholder}}`, value);
};

export default replaceIntlPlaceholder;
