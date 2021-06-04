const resolveStatus = ({ isActive, status }) => {
  let currentStatus = {};
  if (status) {
    switch (status) {
      case 'DRAFT':
        currentStatus = {
          status,
          color: 'red',
        };
        break;
      case 'OPEN':
        currentStatus = {
          status,
          color: 'red',
        };
        break;
      case 'CONFIRMED':
        currentStatus = {
          status,
          color: 'orange',
        };
        break;
      case 'FULLFILLED':
        currentStatus = {
          status,
          color: 'green',
        };
        break;
      default:
        currentStatus = {
          status: isActive ? 'ACTIVE' : 'DRAFT',
          color: isActive ? 'green' : 'red',
        };
    }
  }
  return currentStatus;
};

export default resolveStatus;
