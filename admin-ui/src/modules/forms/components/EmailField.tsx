import TextField from './TextField';
import { validateEmail } from '../lib/validators';

const EmailField = ({ validators = [], value = '', ...props }) => {
  return (
    <TextField
      {...{
        value,
        autoComplete: props?.autoComplete || 'on',
        name: 'email',
        validators: [...validators, validateEmail],
        ...props,
      }}
    />
  );
};

export default EmailField;
