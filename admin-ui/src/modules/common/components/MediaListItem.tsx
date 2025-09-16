import { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Form from '../../forms/components/Form';
import TextField from '../../forms/components/TextField';
import useForm from '../../forms/hooks/useForm';
import useDisplayImageInModal from '../utils/useDisplayImageInModal';
import DeleteButton from './DeleteButton';
import EditIcon from './EditIcon';
import SaveAndCancelButtons from './SaveAndCancelButtons';
import FormErrors from '../../forms/components/FormErrors';
import DraggableIcon from './DraggableIcon';
import ImageWithFallback from './ImageWithFallback';

const MediaListItem = ({
  media,
  mediaText,
  onEdit,
  isEdit,
  onDelete,
  onUpdate,
  id,
}) => {
  const { formatMessage } = useIntl();
  const { displayImageInModal } = useDisplayImageInModal();

  const successMessage = formatMessage({
    id: 'media_updated',
    defaultMessage: 'Media updated',
  });

  const form = useForm({
    submit: onUpdate,
    successMessage,
    initialValues: {
      title: mediaText.title || '',
      subtitle: mediaText.subTitle || '',
    },
  });

  useEffect(() => {
    if (mediaText) form.formik.setValues(mediaText);
  }, [mediaText]);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      key={media._id}
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap gap-4 rounded-sm hover:cursor-pointer"
    >
      <div className="">
        <a onClick={() => displayImageInModal({ url: media?.file?.url })}>
          <ImageWithFallback
            src={media?.file?.url}
            alt={
              mediaText?.title ||
              mediaText?.subtitle ||
              formatMessage({
                id: 'error-loading-image-alt',
                defaultMessage: 'Error loading image',
              })
            }
            className="h-36 w-36 flex-none rounded-md object-cover object-center"
            width={100}
            height={100}
          />
        </a>

        {media?.tags && (
          <div className="space-x-2">
            {media?.tags.map((tag, i) => (
              <span
                key={`${tag}${i + 1}`}
                className="rounded border px-1 text-sm font-light capitalize text-slate-900 dark:text-slate-200 shadow-xs dark:shadow-none"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="my-auto flex-1 basis-1/3">
        <Form form={form}>
          <div className="space-y-2 sm:flex sm:flex-col sm:items-start sm:justify-between">
            <div className="flex flex-auto flex-col justify-center space-y-1 text-sm font-medium text-slate-900 dark:text-slate-500">
              <h3>
                {isEdit ? (
                  <TextField
                    name="title"
                    label={formatMessage({
                      id: 'title',
                      defaultMessage: 'Title',
                    })}
                  />
                ) : (
                  <>
                    <span>
                      {formatMessage({
                        id: 'media_title',
                        defaultMessage: 'Title:',
                      })}
                    </span>
                    <span className="ml-2">{mediaText?.title}</span>
                  </>
                )}
              </h3>
              <p className="sm:block">
                {isEdit ? (
                  <TextField
                    name="subtitle"
                    label={formatMessage({
                      id: 'subtitle',
                      defaultMessage: 'Subtitle',
                    })}
                  />
                ) : (
                  <>
                    <span>
                      {formatMessage({
                        id: 'media_subtitle',
                        defaultMessage: 'Subtitle:',
                      })}
                    </span>
                    <span className="ml-2">{mediaText?.subtitle}</span>
                  </>
                )}
              </p>
            </div>
            <FormErrors />

            {isEdit && (
              <SaveAndCancelButtons
                className="justify-end"
                onCancel={() => onEdit(!isEdit)}
              />
            )}
          </div>
        </Form>
      </div>
      <span
        className="flex items-center gap-5"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {!isEdit && (
          <button
            id="edit"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(!isEdit);
            }}
          >
            <EditIcon />
          </button>
        )}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="hover:cursor-move"
        >
          <DraggableIcon />
        </button>
        <DeleteButton
          onClick={async (e) => {
            e.stopPropagation();
            onDelete(media._id);
          }}
        />
      </span>
    </li>
  );
};

export default MediaListItem;
