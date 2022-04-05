import React from 'react';
import classnames from 'classnames';
import connectField from 'uniforms/connectField';
import filterDOMProps from 'uniforms/filterDOMProps';
import PhoneNumberInput from 'react-phone-number-input';

const Phone = ({
  country = 'CH',
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
  <div
    className={classnames(className, { disabled, error, required }, 'field')}
    {...filterDOMProps(props)}
  >
    {label && <label htmlFor={id}>{label}</label>}
    <div className={classnames('ui', { left: iconLeft, icon: icon || iconLeft }, 'input')}>
      <PhoneNumberInput
        country={country}
        disabled={disabled}
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        ref={inputRef}
        value={value}
      />
      {(icon || iconLeft) && <i className={`${icon || iconLeft} icon`} {...iconProps} />}
      <style jsx global>
        {`
          .rrui__input {
            height: calc(0.3rem * 9) !important;
          }
          .rrui__select__native {
            min-height: calc(0.3rem * 9) !important;
          }
        `}
      </style>
    </div>

    {!!(error && showInlineError) && <div className="ui red basic pointing label">{errorMessage}</div>}
  </div>
);

Phone.displayName = 'Phone';

export default connectField(Phone);
