// Messages in the look of the admin-ui: the empty state of NoData, with a text of its own, and the
// alert banner of the product detail (a deleted product).

export const EmptyNotice = ({ children }) => (
  <div className="flex min-h-[176px] w-full flex-col items-center justify-center rounded-md border-1 border-dashed border-border-default py-8 text-center text-sm text-slate-500 dark:text-slate-400">
    {children}
  </div>
);

const ALERT_TONES = {
  danger:
    'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  warning:
    'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export const AlertNotice = ({
  tone = 'danger',
  children,
}: {
  tone?: keyof typeof ALERT_TONES;
  children: React.ReactNode;
}) => (
  <div role="alert" className={`mb-4 rounded-md border p-4 text-sm ${ALERT_TONES[tone]}`}>
    {children}
  </div>
);
