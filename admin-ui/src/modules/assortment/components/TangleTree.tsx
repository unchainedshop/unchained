import { Fragment } from 'react';
import { scaleOrdinal, schemeDark2 } from 'd3';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import constructTangleLayout from '../utils/contructTangleLayout';
import Badge from '../../common/components/Badge';
import generateUniqueId from '../../common/utils/getUniqueId';

const color = scaleOrdinal(schemeDark2);

const TangleTree = ({ data, options = {} }: { data: any; options?: any }) => {
  const { formatMessage } = useIntl();
  const router = useRouter();

  const tangleLayout = constructTangleLayout(data, options);

  options.color ||= (d, i) => color(i);

  return (
    <>
      <span className="absolute top-2 left-8">
        <button
          type="button"
          className="inline-flex items-center justify-center px-2 py-2 hover:bg-amber-100 dark:hover:bg-yellow-700 rounded-full focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-yellow-600 dark:focus:ring-yellow-500"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon className="h-6 w-6 text-teal-600 hover:text-teal-800" />
        </button>
      </span>

      <svg
        id="tangle-tree"
        width="100%"
        height={`${tangleLayout.layout.height + 6}`}
        className="fill-transparent pt-2 mx-10 w-full"
      >
        {tangleLayout.bundles.map((b, i) => {
          const d = b.links
            .map(
              (l) => `
      M${l.xt} ${l.yt}
      L${l.xb - l.c1} ${l.yt}
      A${l.c1} ${l.c1} 90 0 1 ${l.xb} ${l.yt + l.c1}
      L${l.xb} ${l.ys - l.c2}
      A${l.c2} ${l.c2} 90 0 0 ${l.xb + l.c2} ${l.ys}
      L${l.xs} ${l.ys}`,
            )
            .join('');
          return (
            <Fragment key={d}>
              <path
                className="link stroke-white dark:stroke-slate-600"
                d={`${d}`}
                strokeWidth="5"
              />
              <path
                className="link"
                d={`${d}`}
                stroke={`${options.color(b, i)}`}
                strokeWidth="2"
              />
            </Fragment>
          );
        })}
        {tangleLayout.nodes.map((n, i) => (
          <Fragment key={`${n.id}+${i}`}>
            <path
              className="selectable node"
              data-id={`${n.id}`}
              stroke="black"
              strokeWidth="8"
              d={`M${n.x} ${n.y - n.height / 2} L${n.x} ${n.y + n.height / 2}`}
            />
            <path
              className="node"
              stroke="white"
              strokeWidth="4"
              d={`M${n.x} ${n.y - n.height / 2} L${n.x} ${n.y + n.height / 2}`}
            />
            <foreignObject
              data-id={`${n.id}`}
              x={`${n.x + 4}`}
              y={`${n.y - n.height / 2 - 4}`}
              width="100%"
              height="100%"
            >
              <div>
                <Link
                  href={`/assortments?assortmentSlug=${generateUniqueId({
                    _id: n?.id,
                    texts: n,
                  })}`}
                  className='className="selectable text-slate-950 hover:text-slate-950 dark:text-lime-400 dark:hover:text-lime-500 text-base'
                  id="root"
                >
                  {n?.title}
                </Link>
                {n?.childCount !== undefined && (
                  <>
                    <Link
                      href={`/assortments?viewGraph=true&slug=${generateUniqueId(
                        {
                          _id: n?.id,
                          texts: n,
                        },
                      )}`}
                      className="text-slate-900 dark:text-fuchsia-400 dark:hover:text-fuchsia-600 ml-2 inline-flex items-center px-4 border border-slate-300 shadow-xs text-sm font-medium rounded-md bg-white dark:bg-slate-500 hover:bg-slate-50 dark:hover:bg-slate-400 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
                    >
                      {formatMessage({
                        id: 'children',
                        defaultMessage: 'Children:',
                      })}
                    </Link>
                    <Badge
                      text={n?.childCount}
                      color="purple"
                      className="inline-block mx-2 dark:bg-slate-500 dark:text-purple-400"
                    />
                  </>
                )}
              </div>
            </foreignObject>
          </Fragment>
        ))}
      </svg>
    </>
  );
};

export default TangleTree;
