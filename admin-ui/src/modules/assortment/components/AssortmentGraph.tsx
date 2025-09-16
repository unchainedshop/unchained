import buildAssortmentTree from '../utils/buildAssortmentTree';
import TangleTree from './TangleTree';

const AssortmentGraph = ({ assortments }) => {
  return (
    <div className="relative w-full h-max rounded-lg bg-white dark:shadow-none dark:bg-slate-900 text-slate-900 dark:text-slate-200">
      <TangleTree data={buildAssortmentTree(assortments)} />
    </div>
  );
};

export default AssortmentGraph;
