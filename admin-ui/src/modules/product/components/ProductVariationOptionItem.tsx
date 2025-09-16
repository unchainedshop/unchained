import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import Badge from '../../common/components/Badge';
import TableActionsMenu from '../../common/components/TableActionsMenu';

import Form from '../../forms/components/Form';
import TextField from '../../forms/components/TextField';
import useForm from '../../forms/hooks/useForm';
import useUpdateProductVariationTexts from '../hooks/useUpdateProductVariationTexts';
import useApp from '../../common/hooks/useApp';

const ProductVariationOptionItem = ({ option, onDelete, variationId }) => {
  const { formatMessage } = useIntl();
  const { selectedLocale } = useApp();
  const [isEdit, setIsEdit] = useState(false);
  const successMessage = formatMessage({
    id: 'variation_option_updated',
    defaultMessage: 'Variation option updated successfully!',
  });
  const { updateProductVariationTexts } = useUpdateProductVariationTexts();

  const handleEdit = () => {
    setIsEdit(true);
  };

  const handleDelete = () => {
    onDelete(option.value);
  };

  const onUpdate = async ({ title, subtitle }: any) => {
    const data = await updateProductVariationTexts({
      productVariationId: variationId,
      productVariationOptionValue: option.value,
      texts: [{ title, subtitle, locale: selectedLocale }],
    });
    setIsEdit(false);
    return { data, success: true };
  };
  const form = useForm({
    submit: onUpdate,
    successMessage,
    initialValues: {
      title: option?.texts?.title,
      subtitle: option?.texts?.subtitle,
    },
  });
  return (
    <Form
      form={form}
      className="last:pb-2 variation-option-update-form relative overflow-visible"
    >
      <div className="my-2 rounded-sm border dark:border-slate-700 mx-4 ">
        <div className="p-2 bg-white dark:bg-slate-900 dark:text-slate-200">
          <div className="flex gap-2 w-full items-center justify-between">
            <Badge
              text={option?.texts?.title}
              color="slate"
              className="rounded-md"
            />
            <div className="flex items-center gap-4 w-full">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-400">
                {isEdit ? (
                  <TextField
                    className="mt-0"
                    name="title"
                    required
                    label={formatMessage({
                      id: 'title',
                      defaultMessage: 'Title',
                    })}
                  />
                ) : (
                  option?.value
                )}
              </p>
              <p className="truncate text-sm text-slate-500">
                {isEdit ? (
                  <TextField
                    className="mt-0"
                    name="subtitle"
                    label={formatMessage({
                      id: 'subtitle',
                      defaultMessage: 'Subtitle',
                    })}
                  />
                ) : (
                  option?.texts?.subtitle
                )}
              </p>
            </div>
            <div className="flex items-center justify-end ml-auto">
              {isEdit ? (
                <div className="flex space-x-2 py-2">
                  <button
                    onClick={() => setIsEdit(!isEdit)}
                    aria-label={formatMessage({
                      id: 'cancel',
                      defaultMessage: 'Cancel',
                    })}
                    type="button"
                    className="inline-flex items-center justify-center font-medium shadow-sm focus:outline-hidden focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-2 text-sm h-8 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-slate-500"
                  >
                    {formatMessage({
                      id: 'cancel',
                      defaultMessage: 'Cancel',
                    })}
                  </button>

                  <button
                    type="submit"
                    aria-label={formatMessage({
                      id: 'save',
                      defaultMessage: 'Save',
                    })}
                    className="inline-flex items-center justify-center font-medium shadow-sm focus:outline-hidden focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-2 text-sm h-8 rounded-md border border-slate-800 dark:border-slate-600 bg-slate-800 dark:bg-slate-600 text-white hover:bg-slate-900 dark:hover:bg-slate-500 focus:ring-slate-800 dark:focus:ring-slate-400"
                  >
                    {formatMessage({
                      id: 'save',
                      defaultMessage: 'Save',
                    })}
                  </button>
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
        </div>
      </div>
    </Form>
  );
};

export default ProductVariationOptionItem;
