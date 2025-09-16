import { useState } from 'react';
import VariationForm from './VariationForm';
import VariationDisplay from './VariationDisplay';

const Variation = ({ type, variation, onDelete }) => {
  const [isEdit, setIsEdit] = useState(false);

  return isEdit ? (
    <VariationForm
      variation={variation}
      onCancel={() => setIsEdit(false)}
      onSuccess={() => setIsEdit(false)}
    />
  ) : (
    <VariationDisplay
      type={type}
      variation={variation}
      onEdit={() => setIsEdit(true)}
      onDelete={onDelete}
    />
  );
};

export default Variation;
