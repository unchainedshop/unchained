import { withProps } from 'recompose';
import SimpleSchema from 'simpl-schema';

function isFunction(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
}

const withFormSchema = (schemaDefinition) =>
  withProps((props) => {
    const schema = new SimpleSchema(
      isFunction(schemaDefinition) ? schemaDefinition(props) : schemaDefinition
    );
    return {
      schema,
    };
  });


export default withFormSchema;