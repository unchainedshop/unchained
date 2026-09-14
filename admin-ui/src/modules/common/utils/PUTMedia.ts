const PUTMedia = async (file, url) => {
  const response = await fetch(url, {
    method: 'PUT',
    body: file,
  });

  if (response.ok) {
    return Promise.resolve({});
  }
  return Promise.reject(new Error(response.statusText));
};

export default PUTMedia;
