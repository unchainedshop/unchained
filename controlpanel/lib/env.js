const serverSideEnv = (process.env || {});
const clientSideEnv = (process.browser ? JSON.parse(window.ENV) : {});

const env = { ...clientSideEnv, ...serverSideEnv };
export default env;
