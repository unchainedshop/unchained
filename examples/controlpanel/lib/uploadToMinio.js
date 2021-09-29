const uploadToMinio = async (file, url) => {
  const response = await fetch(url, {
    method: 'PUT',
    body: file,
  });
  if (response.ok) {
    return Promise.resolve({});
  }
  return Promise.reject(new Error('error'));
};

export default uploadToMinio;
