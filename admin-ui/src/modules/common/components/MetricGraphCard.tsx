import { format, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { TrendingUp } from 'lucide-react';

const MetricGraphCard = ({
  icon,
  title,
  value,
  chart,
  dateRange = null,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  chart: React.ReactNode;
  dateRange?: { start: string; end: string };
}) => (
  <Card>
    <CardHeader className="pb-2 flex justify-between gap-3">
      <div>
        <CardDescription className="flex items-center gap-2">
          {icon} {title}
        </CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </div>
      <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <TrendingUp className="h-4 w-4" />
        {dateRange && (
          <span>
            {format(parseISO(dateRange.start), 'MMM d')} {'-'}{' '}
            {format(parseISO(dateRange.end), 'MMM d')}
          </span>
        )}
      </div>
    </CardHeader>
    <CardContent>{chart}</CardContent>
  </Card>
);

export default MetricGraphCard;
