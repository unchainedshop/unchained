import { useIntl } from 'react-intl';
import { useState } from 'react';

import TextField from '../../forms/components/TextField';
import Form from '../../forms/components/Form';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useUpdateFilterTexts from '../hooks/useUpdateFilterTexts';
import Badge from '../../common/components/Badge';
import TableActionsMenu from '../../common/components/TableActionsMenu';
import Button from '../../common/components/Button';
import useApp from '../../common/hooks/useApp';

const FilterOptionsListItem = ({ filterId, option, onDelete }) => {
  const { formatMessage } = useIntl();
  const [isEdit, setIsEdit] = useState(false);
  const { selectedLocale } = useApp();
  const successMessage = formatMessage({
    id: 'saved',
    defaultMessage: 'Saved',
  });

  const { updateFilterTexts } = useUpdateFilterTexts();
  const onSubmit: OnSubmitType = async ({ title, value, subtitle }) => {
    await updateFilterTexts({
      filterId,
      filterOptionValue: value,
      texts: [
        {
          locale: selectedLocale,
          title,
          subtitle,
        },
      ],
    });
    setIsEdit(false);
    return { success: true };
  };

  const handleEdit = () => {
    setIsEdit(!isEdit);
  };

  const handleDelete = () => {
    onDelete(option?.value);
  };

  const form = useForm({
    submit: onSubmit,
    successMessage,
    initialValues: {
      title: '',
      subtitle: '',
      ...option,
      ...option?.texts,
    },
  });

  return (
    <Form form={form}>
      <div className="mt-2">
        <li className="py-2 px-2">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center flex-wrap gap-3">
              <Badge
                text={option?.value}
                color="slate"
                square
                className="break-all"
              />
              <div className="flex flex-wrap gap-3">
                <div className="truncate text-sm text-slate-900 dark:text-slate-200">
                  {isEdit ? (
                    <TextField
                      name="title"
                      required
                      label={formatMessage({
                        id: 'title',
                        defaultMessage: 'Title',
                      })}
                    />
                  ) : (
                    option?.texts?.title
                  )}
                </div>
                <div className="truncate text-sm text-slate-500 dark:text-slate-200">
                  {isEdit ? (
                    <TextField
                      name="subtitle"
                      label={formatMessage({
                        id: 'subtitle',
                        defaultMessage: 'Subtitle',
                      })}
                    />
                  ) : (
                    option?.texts?.subtitle && option?.texts?.subtitle
                  )}
                </div>
              </div>
            </div>
            <div>
              {isEdit ? (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setIsEdit(!isEdit)}
                    text={formatMessage({
                      id: 'cancel',
                      defaultMessage: 'Cancel',
                    })}
                  />
                  <Button
                    variant="primary"
                    disabled={!form.formik.isValid}
                    onClick={form.formik.handleSubmit as any}
                    text={formatMessage({
                      id: 'save',
                      defaultMessage: 'Save',
                    })}
                  />
                </div>
              ) : (
                <TableActionsMenu
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  showEdit={true}
                  showDelete={true}
                />
              )}
            </div>
          </div>
        </li>
      </div>
    </Form>
  );
};

export default FilterOptionsListItem;
