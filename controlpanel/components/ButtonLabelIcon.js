import React from 'react';
import { Icon, Label } from 'semantic-ui-react';

export default ({ iconName, children, ...rest }) => (
  <Label {...rest}>
    <Icon name={iconName} />{children}
  </Label>
);
