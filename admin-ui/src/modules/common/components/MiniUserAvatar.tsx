const MiniUserAvatar = ({
  name = '',
  showName = true,
  className = '',
} = {}) => {
  return (
    <div className={`flex-col ${className}`}>
      {name && showName && (
        <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
          {name}
        </p>
      )}
    </div>
  );
};

export default MiniUserAvatar;
