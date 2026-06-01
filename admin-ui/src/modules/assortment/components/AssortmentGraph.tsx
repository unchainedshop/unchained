import buildAssortmentTree from '../utils/buildAssortmentTree';
import TangleTree from './TangleTree';

const AssortmentGraph = ({ assortments }) => {
  return (
    <div className="relative w-full h-max rounded-lg bg-white dark:shadow-none dark:bg-slate-900 text-text-primary">
      <TangleTree data={buildAssortmentTree(assortments)} />
    </div>
  );
};

export default AssortmentGraph;
