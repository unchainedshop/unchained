const { ROOT_URL } = process.env;

const link = (fileRef, version = 'original', _URIBase = ROOT_URL) => {
  let URIBase = _URIBase;

  if (!(URIBase && typeof URIBase.valueOf() === 'string')) {
    URIBase = ROOT_URL || '/';
  }

  const _root = URIBase.replace(/\/+$/, '');
  const vRef = (fileRef.versions && fileRef.versions[version]) || fileRef || {};

  let ext;
  if (!(URIBase && typeof URIBase.valueOf() === 'string')) {
    ext = `.${vRef.extension.replace(/^\./, '')}`;
  } else {
    ext = '';
  }

  if (fileRef.public === true) {
    return (
      _root +
      (version === 'original'
        ? `${fileRef._downloadRoute}/${fileRef._id}${ext}`
        : `${fileRef._downloadRoute}/${version}-${fileRef._id}${ext}`)
    );
  }
  return `${_root}${fileRef._downloadRoute}/${fileRef._collectionName}/${fileRef._id}/${version}/${fileRef._id}${ext}`;
};

export default {
  url(obj, { version, baseUrl }) {
    console.log(link(obj, version, baseUrl));
    return link(obj, version, baseUrl);
  },
};
