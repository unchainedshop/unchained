import React from "react";
import Cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import dagre from "cytoscape-dagre";

Cytoscape.use(dagre);

const layout = { name: "dagre", fit: true };

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
      item.linkedAssortments.forEach(({ parent, child }) => {
        // We check whether target exists or not for linking to work properly
        if (data.assortments.find((item) => item._id === child._id)) {
          elements.push({
            data: {
              source: parent._id,
              target: child._id,
            },
          });
        }
      });
    }
  });

  const stylesheet = [
    {
      selector: "node",
      style: {
        content: "data(label)",
        "text-opacity": 0.5,
        "text-valign": "center",
        "text-halign": "right",
        "background-color": "#11479e",
      },
    },

    {
      selector: "edge",
      style: {
        width: 4,
        "target-arrow-shape": "triangle",
        "line-color": "#9dbaea",
        "target-arrow-color": "#9dbaea",
        "curve-style": "bezier",
      },
    },
  ];
  return (
    <CytoscapeComponent
      elements={elements}
      layout={layout}
      style={{ width: "100%", height: "600px" }}
      stylesheet={stylesheet}
      zoom={2}
    />
  );
};

export default CytoscapeComponentWrapper;
