export default function shopInfo() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const uptime = process.uptime();
  const instanceStartTime = new Date(Date.now() - uptime * 1000);

  return {
    instanceStartTime,
    startOfToday,
  };
}

//
