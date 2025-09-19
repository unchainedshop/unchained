export interface MessageGroup {
  message: any;
  children: any[];
}

const groupMessageWorks = (workQueue: any[]): MessageGroup[] => {
  if (!workQueue) return [];

  const messageWorks = workQueue.filter((work) => work.type === 'MESSAGE');
  const childWorks = workQueue.filter(
    (work) => work.original && work.original._id,
  );

  const groups: MessageGroup[] = [];

  messageWorks.forEach((message) => {
    const relatedChildren = childWorks.filter(
      (child) => child.original._id === message._id,
    );

    groups.push({
      message,
      children: relatedChildren.sort((a, b) => a.retries - b.retries),
    });
  });

  return groups.sort(
    (a, b) =>
      new Date(b.message.created).getTime() -
      new Date(a.message.created).getTime(),
  );
};

export default groupMessageWorks;
