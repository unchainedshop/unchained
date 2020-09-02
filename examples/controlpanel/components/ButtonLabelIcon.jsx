import React from 'react';
import { Icon, Label } from 'semantic-ui-react';

const ButtonLabelIcon ({ iconName, children, ...rest }) => (
  <Label {...rest}>
    <Icon name={iconName} />
    {children}
  </Label>
);


export default ButtonLabelIcon;