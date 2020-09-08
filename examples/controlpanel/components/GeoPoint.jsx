import React from 'react';
import { List } from 'semantic-ui-react';

const GeoPoint = ({ latitude, longitude }) => (
  <List>
    <List.Item>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.google.com/maps/@${latitude},${longitude},17z`}
      >
        Open in Google Maps
      </a>
    </List.Item>
  </List>
);

export default GeoPoint;