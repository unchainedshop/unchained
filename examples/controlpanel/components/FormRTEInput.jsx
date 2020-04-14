import React from 'react';
import { compose, withState, withHandlers } from 'recompose';
import classnames from 'classnames';
import connectField from 'uniforms/connectField';
import filterDOMProps from 'uniforms/filterDOMProps';
import RichTextEditor from 'react-rte';

const toolbarConfig = {
  // Optionally specify the groups to display (displayed in the order listed).
  display: [
    'INLINE_STYLE_BUTTONS',
    'BLOCK_TYPE_BUTTONS',
    'LINK_BUTTONS',
    'BLOCK_TYPE_DROPDOWN',
    'HISTORY_BUTTONS',
  ],
  INLINE_STYLE_BUTTONS: [
    { label: 'Bold', style: 'BOLD', className: 'custom-css-class' },
    { label: 'Italic', style: 'ITALIC' },
    { label: 'Underline', style: 'UNDERLINE' },
  ],
  BLOCK_TYPE_DROPDOWN: [
    { label: 'Normal', style: 'unstyled' },
    { label: 'Heading Large', style: 'header-one' },
    { label: 'Heading Medium', style: 'header-two' },
    { label: 'Heading Small', style: 'header-three' },
  ],
  BLOCK_TYPE_BUTTONS: [
    { label: 'UL', style: 'unordered-list-item' },
    { label: 'OL', style: 'ordered-list-item' },
  ],
};

const FormRTEInput = ({
  className,
  updateRichtext,
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
  component,
  rteValue,
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
      <RichTextEditor
        disabled={disabled}
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        toolbarConfig={toolbarConfig}
        ref={inputRef}
        value={rteValue}
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

FormRTEInput.displayName = 'FormRTEInput';

export default compose(
  connectField,
  withState('rteValue', 'updateRichtext', ({ value }) =>
    value
      ? RichTextEditor.createValueFromString(value, 'markdown')
      : RichTextEditor.createEmptyValue()
  ),
  withHandlers({
    onChange: ({ onChange, updateRichtext }) => (value) => {
      updateRichtext(value);
      onChange(value.toString('markdown'));
    },
  })
)(FormRTEInput);
