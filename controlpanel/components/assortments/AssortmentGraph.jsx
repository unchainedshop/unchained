import {
  compose, withProps, withHandlers, withState,
} from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import { InteractiveForceGraph, ForceGraphNode, ForceGraphLink } from 'react-vis-force';

const AssortmentList = ({
  nodes, links, isShowLeafNodes, toggleShowLeafNodes, data: { loading },
}) => (nodes.length > 0 ? (
  <div>
    <div>
      Show non-root nodes?
      &nbsp;
      <input type="checkbox" checked={isShowLeafNodes} onClick={toggleShowLeafNodes} />
    </div>
    {loading ? (
      <div>
        <h1>
          Loading... this can take a while...
        </h1>
      </div>
    ) : (
      <InteractiveForceGraph
        zoom
        simulationOptions={{ height: 600, width: 600 }}
        labelAttr="label"
      >
        {nodes.map(node => <ForceGraphNode key={node.id} node={node} fill={node.fill} />)}
        {links.map(link => <ForceGraphLink key={link.id} link={link} />)}
      </InteractiveForceGraph>
    )}

  </div>
) : null);

const assortmentToNode = assortment => ({
  label: assortment.texts.title,
  fill: assortment.isRoot ? 'blue' : 'grey',
  radius: assortment.isRoot ? 7 : 4,
  group: assortment.sequence,
  id: assortment._id,
});

export default compose(
  withState('isShowLeafNodes', 'setShowLeafNodes', false),
  graphql(gql`
    query assortmentLinks($isShowLeafNodes: Boolean) {
      assortments(limit: 0, offset: 0, includeLeaves: $isShowLeafNodes) {
        _id
        isRoot
        sequence
        texts {
          title
        }
        linkedAssortments {
          _id
          parent {
            _id
            sequence
            texts {
              title
            }
          }
          child {
            _id
            sequence
            texts {
              title
            }
          }
        }
      }
    }
  `),
  withHandlers({
    toggleShowLeafNodes: ({
      isShowLeafNodes, setShowLeafNodes,
    }) => () => setShowLeafNodes(!isShowLeafNodes),
  }),
  withProps(({ data: { assortments = [] } = {} }) => {
    const links = [];
    const nodes = Object.values(assortments
      .reduce((assortmentAccumulator, assortment) => {
        const assortmentsResult = assortmentAccumulator;
        if (!assortmentsResult[assortment._id]) {
          assortmentsResult[assortment._id] = assortmentToNode(assortment);
        }
        if (assortment.linkedAssortments) {
          assortment.linkedAssortments.forEach((link) => {
            if (!assortmentsResult[link.parent._id]) {
              assortmentsResult[link.parent._id] = assortmentToNode(link.parent);
            }
            if (!assortmentsResult[link.child._id]) {
              assortmentsResult[link.child._id] = assortmentToNode(link.child);
            }
            links.push(`${link.parent._id}.${link.child._id}`);
          });
        }
        return assortmentsResult;
      }, {}));

    return {
      nodes,
      links: [...new Set(links)].map(keypath => ({
        id: keypath,
        source: keypath.split('.')[0],
        target: keypath.split('.')[1],
        strokeWidth: 1,
      })),
    };
  }),
)(AssortmentList);
