import { compose, withProps } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import { InteractiveForceGraph, ForceGraphNode, ForceGraphLink } from 'react-vis-force';

const AssortmentList = ({ nodes, links }) => (nodes.length > 0 ? (
  <InteractiveForceGraph
    zoom
    simulationOptions={{ height: 600, width: 600 }}
    labelAttr="label"
    onSelectNode={node => console.log(node)}
    highlightDependencies
  >
    {nodes.map(node => (
      <ForceGraphNode key={node.id} node={node} fill={node.fill} />
    ))}
    {links.map(link => (
      <ForceGraphLink key={link.id} link={link} />
    ))}
  </InteractiveForceGraph>
) : null);

export default compose(
  graphql(gql`
    query assortmentLinks {
      assortments(limit: 0, offset: 0, includeLeaves: true) {
        _id
        isRoot
        texts {
          title
        }
        linkedAssortments {
          _id
          parent {
            _id
          }
          child {
            _id
          }
        }
      }
    }
  `),
  withProps(({ data: { assortments = [] } = {} }) => {
    const links = [];
    const nodes = assortments.map((assortment) => {
      if (assortment.linkedAssortments) {
        assortment.linkedAssortments.forEach((link) => {
          links.push(`${link.parent._id}.${link.child._id}`);
        });
      }
      return {
        label: assortment.texts.title,
        fill: assortment.isRoot ? 'blue' : 'grey',
        radius: assortment.isRoot ? 7 : 4,
        group: assortment.sequence,
        id: assortment._id,
      };
    });

    return {
      nodes,
      links: [...new Set(links)].map(keypath => ({
        id: keypath,
        source: keypath.split('.')[0],
        target: keypath.split('.')[1],
        value: 2,
      })),
    };
  }),
)(AssortmentList);
