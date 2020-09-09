import React, { useState, useEffect } from 'react';
import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import dagre from 'cytoscape-dagre';
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import remove from 'lodash/remove';

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
  const [node, setNode] = useState({});
  const [graphElements, setGraphElements] = useState([]);
  const { data, loading } = useQuery(GET_ASSORTMENT_LINKS, {
    variables: {
      assortmentId: node?.id,
    },
    skip: !node?.id,
  });

  const drawNode = (item) => {
    setGraphElements((prevGraphElements) => {
      return [
        ...prevGraphElements,
        {
          data: {
            id: item._id,
            label: item.texts.title,
          },
        },
      ];
    });
  };

  const drawEdge = (linkedAssortment) => {
    // We check whether child/target exists or not for linking to work properly
    // parent already exists since we're searching inside its linked assortments
    // Also, we check for already existing links before adding new ones since
    // the parent and child cross-references each other
    if (
      assortments.find(
        (assortment) => assortment._id === linkedAssortment.child._id
      ) &&
      !graphElements.find((link) => {
        return (
          link.data.source === linkedAssortment.parent._id &&
          link.data.target === linkedAssortment.child._id
        );
      })
    ) {
      setGraphElements((prevGraphElements) => {
        return [
          ...prevGraphElements,
          {
            data: {
              source: linkedAssortment.parent._id,
              target: linkedAssortment.child._id,
            },
          },
        ];
      });
    }
  };

  const drawGraph = function () {
    assortments?.forEach((item) => {
      drawNode(item);

      if (item.linkedAssortments) {
        item.linkedAssortments.forEach((linkedAssortment) => {
          drawEdge(linkedAssortment);
        });
      }
    });
  };

  useEffect(() => {
    drawGraph(); // Initial Draw
  }, []);

  useEffect(() => {
    data?.assortment?.linkedAssortments.forEach((linkedAssortment) => {
      if (
        !graphElements.find(
          (element) => element.data.id === linkedAssortment.child._id
        )
      ) {
        setGraphElements((prevGraphElements) => {
          return [
            ...prevGraphElements,
            {
              data: {
                display: true,
                id: linkedAssortment.child._id,
                label: linkedAssortment.child.texts.title,
              },
            },
          ];
        });
      }

      // Check for edges
      if (
        graphElements.find(
          (element) => element.data.id === linkedAssortment.child._id
        ) &&
        !graphElements.find((element) => {
          return (
            element.data.source === linkedAssortment.parent._id &&
            element.data.target === linkedAssortment.child._id
          );
        })
      ) {
        setGraphElements((prevGraphElements) => {
          return [
            ...prevGraphElements,
            {
              data: {
                source: linkedAssortment.parent._id,
                target: linkedAssortment.child._id,
              },
            },
          ];
        });
      }
    });
  }, [node]);

  // console.log('graphElements', graphElements);

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
      elements={graphElements}
      layout={layout}
      style={{ width: '100%', height: '600px' }}
      stylesheet={stylesheet}
      cy={(cy) => {
        cy = cy.on('tap', 'node', function (evt) {
          const node = evt.target;
          setNode((prevNode) => {
            return {
              id: node.id(),
              display: prevNode !== node.id(),
            };
          });
        });
      }}
      zoom={2}
    />
  );
};

export default CytoscapeComponentWrapper;
