import Image from 'next/image';
import ImageWithFallback from '../../../common/components/ImageWithFallback';

const renderImage = (data: any) => {
  const { imageUrl, media, file } = data || {};
  if (imageUrl) {
    return (
      <Image alt="Generated image" src={imageUrl} width={1200} height={50} />
    );
  }
  const singleMediaURL = file?.url;
  if (singleMediaURL) {
    return (
      <div className="space-y-2">
        <ImageWithFallback
          src={singleMediaURL}
          alt={file?.name || `Media file: ${singleMediaURL}`}
          width={128}
          height={128}
          className="w-100 object-cover rounded shadow"
        />
        <a
          href={singleMediaURL}
          target="_blank"
          className="text-xs font-mono link"
        >
          {singleMediaURL}
        </a>
      </div>
    );
  }
  if (media?.length) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        {media.map((item) => (
          <div
            key={item.id || item.file?.url}
            className="flex flex-col items-center space-y-2"
          >
            <ImageWithFallback
              src={item?.file?.url}
              alt={
                item.file?.name || `Media file: ${item.file?._id || 'Unknown'}`
              }
              width={128}
              height={128}
              className="w-full h-full object-cover rounded shadow"
            />
            <span className="text-xs text-gray-500 break-all font-mono">
              {item._id}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default renderImage;
