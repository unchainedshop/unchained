import Minio from 'minio';

const client = new Minio.Client({
  endPoint: '172.18.0.1',
  port: 9000,
  useSSL: false,
  accessKey: '8H3FOTEB3W62ATGT3V32',
  secretKey: 'AIMx5wmsWG9WUpE3WN6qe9SL4oIRklHhtG3yYn+V',
});

export const createSignedPutURL = async (fileName, bucketName, expires) => {
  return client.presignedPutObject(bucketName, fileName, expires);
};

export default client;
