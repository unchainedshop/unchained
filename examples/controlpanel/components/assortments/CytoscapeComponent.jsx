import React from 'react';
import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import dagre from 'cytoscape-dagre';

Cytoscape.use(dagre);

const layout = { name: 'dagre', fit: true };

const CytoscapeComponentWrapper = ({ data }) => {
  const elements = [];
  data.assortments?.forEach((item) => {
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
          data.assortments.find(
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
      zoom={2}
    />
  );
};

export default CytoscapeComponentWrapper;
