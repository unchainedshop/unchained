import classnames from 'classnames';
import TagInput from '../../common/components/TagInput';

import useField, { FieldHookProps } from '../hooks/useField';
import { validateRequiredTag } from '../lib/validators';
import FieldWrapper from './FieldWrapper';

const TagInputField = ({
  buttonText = '',
  validators = [],
  selectOptions = [],
  ...props
}: FieldHookProps & { selectOption?: string[] }) => {
  const field = useField({
    validators: [...validators, validateRequiredTag(props?.required)],
    label: 'Tags',
    ...props,
  });
  return (
    <FieldWrapper {...field}>
      <TagInput
        disabled={field.disabled}
        id={field.id}
        name={field.name}
        className={classnames({
          'border-rose-300': !!field.error,
        })}
        onChange={(value) => field.setValue(value)}
        placeholder={field.placeholder}
        tagList={field.value}
        buttonText={buttonText}
        selectOptions={selectOptions}
      />
    </FieldWrapper>
  );
};

export default TagInputField;
