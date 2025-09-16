import { PencilSquareIcon } from '@heroicons/react/20/solid';

const EditIcon = () => {
  return (
    <div
      id="edit__icon_button"
      className="rounded-full dark:bg-slate-800 dark:hover:bg-slate-600 p-2 text-sm text-slate-900 dark:text-slate-200 hover:bg-transparent focus:outline-hidden focus:ring-0 focus:ring-rose-500 focus:ring-offset-2"
    >
      <PencilSquareIcon className="h-5 w-5" />
    </div>
  );
};

export default EditIcon;
