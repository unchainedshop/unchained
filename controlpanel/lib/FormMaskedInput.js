import React from 'react';
import classnames from 'classnames';
import connectField from 'uniforms/connectField';
import filterDOMProps from 'uniforms/filterDOMProps';
import InputMask from 'react-input-mask';

const parseAndForwardValue = onChange => event =>
  onChange(event.target.value);

const MaskedText = ({
  mask,
  maskChar = '_',
  formatChars,
  alwaysShowMask,
  className,
  disabled,
  error,
  errorMessage,
  icon,
  iconLeft,
  iconProps,
  id,
  inputRef,
  label,
  max,
  min,
  name,
  onChange,
  placeholder,
  required,
  showInlineError,
  value,
  component,
  ...props
}) => (
  <div className={classnames(className, { disabled, error, required }, 'field')} {...filterDOMProps(props)}>
    {label && (
      <label htmlFor={id}>
        {label}
      </label>
    )}
    <div className={classnames('ui', { left: iconLeft, icon: icon || iconLeft }, 'input')}>
      <InputMask
        mask={mask}
        maskChar={maskChar}
        alwaysShowMask={alwaysShowMask}
        disabled={disabled}
        id={id}
        name={name}
        onChange={parseAndForwardValue(onChange)}
        placeholder={placeholder}
        ref={inputRef}
        value={value}
      />
      {(icon || iconLeft) && (
        <i className={`${icon || iconLeft} icon`} {...iconProps} />
      )}
    </div>

    {!!(error && showInlineError) && (
      <div className="ui red basic pointing label">
        {errorMessage}
      </div>
    )}
  </div>
);

MaskedText.displayName = 'MaskedText';

export default connectField(MaskedText);
