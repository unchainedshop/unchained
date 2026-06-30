import clsx from 'clsx';

import FieldWrapper from '@/components/ui/form/FieldWrapper';
import { TextFieldProps } from '@/components/ui/form/TextField';
import useField from '../../forms/hooks/useField';
import deBounce from '../utils/deBounce';
import Combobox from '@/components/ui/form/Combobox';

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
          className={clsx('my-2 flex items-center rounded-sm', props.className)}
        >
          <div className="w-full">
            <FieldWrapper {...field}>
              <Combobox
                id={field.id || field.name}
                name={field.name}
                disabled={!!field.disabled}
                isLoading={props.isLoading}
                placeholder={field.placeholder}
                onSearch={debouncedFilter}
                options={
                  data?.map((item) => ({
                    label: item.title,
                    value: item.id,
                  })) || []
                }
                value={field.value as string}
                onChange={(val) => {
                  field.setValue(val as string, true);
                }}
              />
            </FieldWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterableDropdown;
