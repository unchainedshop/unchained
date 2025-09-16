const defaultNextImageLoader = ({ src, width, quality = 75 }) => {
  if (src) return `${src}?w=${width}&q=${quality}`;

  return '/no-image.jpg';
};

export default defaultNextImageLoader;
