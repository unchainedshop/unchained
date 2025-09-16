const BlockingContent = ({ children }) => {
  return (
    <div
      className="flex px-4 pt-4 pb-20 text-center sm:block sm:p-0"
      role="button"
    >
      <div
        className="fixed inset-0 bg-slate-500 bg-opacity/75 transition-opacity"
        aria-hidden="true"
      />
      <span
        className="hidden sm:inline-block sm:h-screen sm:align-middle"
        aria-hidden="true"
      >
        &#8203;
      </span>
      <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-slate-900 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
        <div className="flex min-h-full flex-col bg-white dark:bg-slate-900 pt-16 pb-12 ">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BlockingContent;
