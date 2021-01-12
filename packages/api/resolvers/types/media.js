const { ROOT_URL } = process.env;

const link = (fileRef, version = 'original', _URIBase = ROOT_URL) => {
  let URIBase = _URIBase;

  if (!(URIBase && typeof URIBase.valueOf() === 'string')) {
    URIBase = ROOT_URL || '/';
  }

  const root = URIBase.replace(/\/+$/, '');
  const vRef = (fileRef.versions && fileRef.versions[version]) || fileRef || {};

  let ext;
  if (!(URIBase && typeof URIBase.valueOf() === 'string')) {
    ext = `.${vRef.extension.replace(/^\./, '')}`;
  } else {
    ext = '';
  }

  if (fileRef.public === true) {
    return (
      root +
      (version === 'original'
        ? `${fileRef.downloadRoute}/${fileRef._id}${ext}`
        : `${fileRef.downloadRoute}/${version}-${fileRef._id}${ext}`)
    );
  }
  return `${root}${fileRef.downloadRoute}/${fileRef.collectionName}/${fileRef._id}/${version}/${fileRef._id}${ext}`;
};

export default {
  url(obj, { version, baseUrl }) {
    return link(obj, version, baseUrl);
  },
};
