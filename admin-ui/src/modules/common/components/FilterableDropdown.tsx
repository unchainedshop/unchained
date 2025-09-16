import classNames from 'classnames';

import FieldWrapper from '../../forms/components/FieldWrapper';
import { TextFieldProps } from '../../forms/components/TextField';
import useField from '../../forms/hooks/useField';
import deBounce from '../utils/deBounce';
import UnchainedSelect from './UnchainedSelect';

interface FilterableData {
  id: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  image?: string;
}

interface FilterableDropdownProps extends TextFieldProps {
  data?: FilterableData[];
  onFilter?: any;
}

const FilterableDropdown = ({
  data,
  onFilter,
  ...props
}: FilterableDropdownProps) => {
  const field = useField({ ...props });
  const debouncedFilter = deBounce(200)(onFilter);

  return (
    <div className="relative flex flex-col items-center">
      <div className="w-full">
        <div
          className={classNames(
            'my-2 flex items-center rounded-sm',
            props.className,
          )}
        >
          <div className="w-full">
            <FieldWrapper {...field}>
              <UnchainedSelect
                isDisabled={!!field.disabled}
                id={field.id}
                isLoading={props.isLoading}
                name={field.name}
                onBlur={field.onBlur}
                onInputChange={debouncedFilter}
                onChange={({ value }) => {
                  field.setValue(value, true);
                }}
                placeholder={field.placeholder}
                options={data?.map((item) => ({
                  label: item.title,
                  value: item.id,
                }))}
              />
            </FieldWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterableDropdown;
