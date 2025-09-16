import React from 'react';
import { XCircle } from 'lucide-react';

interface RemovedVector {
  key: string;
  value: string;
}

interface RemovedVectorsDisplayProps {
  removedVectors: RemovedVector[];
}

const RemovedVectorsDisplay: React.FC<RemovedVectorsDisplayProps> = ({
  removedVectors,
}) => {
  if (!removedVectors?.length) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {removedVectors.map((vector, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium
                     bg-red-100/60 dark:bg-red-900/40 text-red-700 dark:text-red-300
                     border border-red-300 dark:border-red-700 border-dashed
                     rounded line-through opacity-80 hover:opacity-100 transition-opacity"
          title="Removed"
        >
          <XCircle className="w-3 h-3 opacity-70" />
          {vector.key}: {vector.value}
        </span>
      ))}
    </div>
  );
};

export default RemovedVectorsDisplay;
