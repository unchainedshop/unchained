import React from 'react';
import { compose, withState, withHandlers, mapProps } from 'recompose';
import classnames from 'classnames';
import connectField from 'uniforms/connectField';
import filterDOMProps from 'uniforms/filterDOMProps';
import { Dropdown } from 'semantic-ui-react';

const FormTagInputField = ({
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
  onAddItem,
  placeholder,
  required,
  showInlineError,
  value,
  component,
  normalizedOptions,
  ...props
}) => (
  <div
    className={classnames(className, { disabled, error, required }, 'field')}
    {...filterDOMProps(props)}
  >
    {label && <label htmlFor={id}>{label}</label>}
    <div
      className={classnames(
        'ui',
        { left: iconLeft, icon: icon || iconLeft },
        'input'
      )}
    >
      <Dropdown
        options={normalizedOptions}
        placeholder={placeholder}
        search
        selection
        fluid
        multiple
        allowAdditions
        id={id}
        name={name}
        disabled={disabled}
        value={value}
        onChange={onChange}
        onAddItem={onAddItem}
        ref={inputRef}
      />
      {(icon || iconLeft) && (
        <i className={`${icon || iconLeft} icon`} {...iconProps} />
      )}
    </div>

    {!!(error && showInlineError) && (
      <div className="ui red basic pointing label">{errorMessage}</div>
    )}
  </div>
);

FormTagInputField.displayName = 'FormTagInputField';

export default compose(
  connectField,
  withState('ownOptions', 'updateOwnOptions', []),
  withHandlers({
    onChange: ({ onChange }) => (event, { value }) => onChange(value),
    onAddItem: ({ ownOptions, updateOwnOptions }) => (event, { value }) =>
      updateOwnOptions([{ key: value, text: value, value }, ...ownOptions]),
  }),
  mapProps(
    ({ options, ownOptions, updateOwnOptions, value: values, ...rest }) => {
      const mappedValues = values.map((value) => ({
        key: value,
        text: value,
        value,
      }));
      const undeduplicatedOptions = [
        ...ownOptions,
        ...options,
        ...mappedValues,
      ];
      const deduplicatedOptionMap = undeduplicatedOptions.reduce(
        (oldOptions, curOption) => {
          if (oldOptions[curOption.key]) return oldOptions;
          const newOptions = oldOptions;
          newOptions[curOption.key] = curOption;
          return newOptions;
        },
        {}
      );
      return {
        normalizedOptions: Object.values(deduplicatedOptionMap),
        options,
        value: values,
        ...rest,
      };
    }
  )
)(FormTagInputField);
