import React from 'react';
import TextField, { TextFieldProps } from './TextField';
import HelpText from '../../common/components/HelpText';

interface FieldWithHelpProps extends TextFieldProps {
  helpKey?: string;
  helpText?: string;
  helpValues?: Record<string, any>;
}

const FieldWithHelp: React.FC<FieldWithHelpProps> = ({
  helpKey,
  helpText,
  helpValues,
  ...textFieldProps
}) => {
  return (
    <div className="space-y-1">
      <TextField {...textFieldProps} />
      {(helpKey || helpText) && (
        <HelpText
          messageKey={helpKey || `${textFieldProps.name}_help`}
          defaultMessage={helpText}
          values={helpValues}
          className="mt-1"
        />
      )}
    </div>
  );
};

export default FieldWithHelp;
