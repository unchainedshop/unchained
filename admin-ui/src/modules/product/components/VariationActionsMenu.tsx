import { useIntl } from 'react-intl';

const VariationActionsMenu = ({ onEdit, onDelete, menuRef, position }) => {
  const { formatMessage } = useIntl();
  return (
    <div
      ref={menuRef}
      className="fixed w-48"
      style={{ top: position.top, left: position.left }}
    >
      <button onClick={onEdit}>
        {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
      </button>
      <button onClick={onDelete}>
        {formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
      </button>
    </div>
  );
};

export default VariationActionsMenu;
