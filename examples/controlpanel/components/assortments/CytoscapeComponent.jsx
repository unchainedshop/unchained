import React from 'react';
import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import dagre from 'cytoscape-dagre';
import { useApolloClient } from '@apollo/client';
import gql from 'graphql-tag';

const GET_ASSORTMENT_LINKS = gql`
  query assortmentLinks($assortmentId: ID) {
    assortment(assortmentId: $assortmentId) {
      _id
      linkedAssortments {
        _id
        parent {
          _id
          texts {
            _id
            title
          }
        }
        child {
          _id
          texts {
            _id
            title
          }
        }
      }
    }
  }
`;

Cytoscape.use(dagre);

const layout = { name: 'dagre', fit: true };

const CytoscapeComponentWrapper = ({ assortments }) => {
  const client = useApolloClient();

  const elements = [];

  assortments?.forEach((item) => {
    elements.push({
      data: {
        id: item._id,
        label: item.texts.title,
      },
    });
    if (item.linkedAssortments) {
      item.linkedAssortments.forEach((linkedAssortment) => {
        // We check whether child/target exists or not for linking to work properly
        // parent already exists since we're searching inside its linked assortments
        // Also, we check for already existing links before adding new ones since
        // the parent and child cross-references each other
        if (
          assortments.find(
            (assortment) => assortment._id === linkedAssortment.child._id
          ) &&
          !elements.find((link) => {
            return (
              link.data.source === linkedAssortment.parent._id &&
              link.data.target === linkedAssortment.child._id
            );
          })
        ) {
          elements.push({
            data: {
              source: linkedAssortment.parent._id,
              target: linkedAssortment.child._id,
            },
          });
        }
      });
    }
  });

  const stylesheet = [
    {
      selector: 'node',
      style: {
        content: 'data(label)',
        'text-opacity': 0.5,
        'text-valign': 'center',
        'text-halign': 'right',
        'background-color': '#11479e',
      },
    },

    {
      selector: 'edge',
      style: {
        width: 4,
        'target-arrow-shape': 'triangle',
        'line-color': '#9dbaea',
        'target-arrow-color': '#9dbaea',
        'curve-style': 'bezier',
      },
    },
  ];
  return (
    <CytoscapeComponent
      elements={elements}
      layout={layout}
      style={{ width: '100%', height: '600px' }}
      stylesheet={stylesheet}
      cy={async (cy) => {
        cy.on('add', 'node', () => {
          cy.layout(layout).run();
          cy.fit();
        });
        cy.on('tap', 'node', async (evt) => {
          const node = evt.target;
          const { data } = await client.query({
            query: GET_ASSORTMENT_LINKS,
            variables: { assortmentId: node.id() },
          });

          const nodeIds = cy.nodes().map((node) => node.id());
          const edges = cy.edges().map((edge) => {
            return {
              source: edge.source().id(),
              target: edge.target().id(),
            };
          });

          // Evaluate parents of children
          for (const linkedAssortment of data?.assortment?.linkedAssortments) {
            const result = await client.query({
              query: GET_ASSORTMENT_LINKS,
              variables: { assortmentId: linkedAssortment.child._id },
            });

            const nodeEdges = result.data.assortment.linkedAssortments.map(
              (lnkAssortment) => {
                return {
                  group: 'edges',
                  data: {
                    source: lnkAssortment.parent._id,
                    target: lnkAssortment.child._id,
                  },
                };
              }
            );

            if (
              !nodeIds.find(
                (nodeId) => nodeId === linkedAssortment.child._id
              ) &&
              !edges.find((edge) => {
                return (
                  edge.source === linkedAssortment.parent._id &&
                  edge.target === linkedAssortment.child._id
                );
              })
            ) {
              cy.add([
                {
                  group: 'nodes',
                  data: {
                    id: linkedAssortment.child._id,
                    label: linkedAssortment.child.texts.title,
                  },
                },
                ...nodeEdges.filter((edge) => {
                  return [nodeIds, linkedAssortment.child._id].includes(
                    edge.data.target
                  );
                }),
              ]);
            }
          }
        });
      }}
      zoom={2}
    />
  );
};

export default CytoscapeComponentWrapper;
