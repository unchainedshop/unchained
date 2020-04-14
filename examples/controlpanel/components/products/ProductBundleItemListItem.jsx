import React from 'react';
import { compose, withState, withHandlers } from 'recompose';
import { List, Button } from 'semantic-ui-react';

const ProductBundleItemListItem = ({
  index,
  product,
  quantity,
  isEditing,
  removeItem,
}) => (
  <List.Item>
    <List.Content floated="right">
      <Button onClick={() => removeItem(index)}>X</Button>
    </List.Content>
    <List.Content>
      <List.Header>
        {product && product.texts && `${product.texts.title}`}
      </List.Header>
      <List.Description>
        Quantity:
        {quantity}
      </List.Description>
      {isEditing ? <p>Editing</p> : ''}
    </List.Content>
  </List.Item>
);

export default compose(
  withState('isEditing', 'setIsEditing', false),
  withHandlers({
    toggleEditing: ({ isEditing, setIsEditing }) => (event) => {
      if (event && event.preventDefault) event.preventDefault();
      setIsEditing(!isEditing);
    },
  })
)(ProductBundleItemListItem);
