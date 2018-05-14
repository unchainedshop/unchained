const serverSideEnv = (process.env || {});
const clientSideEnv = (process.browser ? JSON.parse(window.ENV) : {});

export default { ...clientSideEnv, ...serverSideEnv };
