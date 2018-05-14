import objectPath from 'object-path';

export default function graphqlServerExpressUpload() {
  return function uploadMiddleware(req, res, next) {
    if (!(req.method === 'POST' && req.is('multipart/form-data'))) {
      return next();
    }
    const { files, body: { operations, map } } = req;
    const operationsParsed = JSON.parse(operations);
    const operationsPath = objectPath(operationsParsed);
    const mapParsed = JSON.parse(map);
    Object.entries(mapParsed).forEach(([mapFieldName, paths]) => {
      files.forEach((file) => {
        const mappedFile = {
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          buffer: file.buffer,
        };
        if (file.fieldname === mapFieldName) {
          paths.forEach(path => operationsPath.set(path, mappedFile));
        }
      });
    });

    req.body = operationsParsed;
    return next();
  };
}
