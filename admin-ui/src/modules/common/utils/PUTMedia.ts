const PUTMedia = async (file, url) => {
  const response = await fetch(url, {
    method: 'PUT',
    // headers: { 'Content-Type': 'application/json' },
    body: file,
  });

  if (response.ok) {
    return Promise.resolve({});
  }
  return Promise.reject(new Error(response.statusText));
};

export default PUTMedia;
