import { formatDistanceToNowStrict, formatDuration } from 'date-fns';

const useFormatWorkDurations = () => {
  const getScheduledTime = (time) => {
    if (!time) return null;
    const { scheduled, status, started } = time;
    if (status === 'FAILED' || status === 'SUCCESS' || status === 'DELETED')
      return null;
    const scheduledTime = new Date(scheduled).getTime();

    if (status === 'ALLOCATED' || (status === 'NEW' && !started)) {
      return formatDistanceToNowStrict(scheduledTime, {
        addSuffix: true,
      });
    }
    return null;
  };

  const getDuration = (durations) => {
    if (!durations) return null;
    const { started, finished } = durations;
    const now = new Date().getTime();
    if (!started) return null;
    let durationInMS = null;
    if (started && !finished) {
      durationInMS = now - new Date(started).getTime();
    } else {
      durationInMS = new Date(finished).getTime() - new Date(started).getTime();
    }
    return formatDuration(
      {
        hours: Number(Math.floor(durationInMS / 1000 / 60 / 60) % 24),
        minutes: Number(Math.floor(durationInMS / 1000 / 60) % 60),
        seconds: Number(Math.ceil(durationInMS / 1000) % 60),
      },
      { zero: false },
    );
  };

  return { getScheduledTime, getDuration };
};

export default useFormatWorkDurations;
