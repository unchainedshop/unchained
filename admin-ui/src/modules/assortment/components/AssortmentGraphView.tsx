import Loading from '../../common/components/Loading';
import AssortmentGraph from './AssortmentGraph';
import useAssortmentChildren from '../hooks/useAssortmentChildren';
import useApp from '../../common/hooks/useApp';

const AssortmentGraphView = ({ options }) => {
  const { includeInactive, slug } = options;
  const { selectedLocale } = useApp();
  const { assortments, loading } = useAssortmentChildren({
    slugs: slug ? [slug].filter(Boolean) : null,
    includeInactive,
    includeLeaves: !!slug,
    forceLocale: selectedLocale,
  });

  return (
    <div className="mt-5">
      {loading ? <Loading /> : <AssortmentGraph assortments={assortments} />}
    </div>
  );
};

export default AssortmentGraphView;
