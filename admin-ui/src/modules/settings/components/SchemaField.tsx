import TextField from '@/components/ui/form/TextField';
import CheckboxField from '@/components/ui/form/CheckboxField';
import SelectField from '@/components/ui/form/SelectField';
import JSONAreaField from '@/components/ui/form/JSONAreaField';

function humanizeKey(key: string): string {
  const lastSegment = key.includes('.') ? key.split('.').pop() : key;
  return lastSegment
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

interface SchemaFieldProps {
  name: string;
  schema: Record<string, unknown>;
  disabled?: boolean;
}

const SchemaField = ({ name, schema, disabled }: SchemaFieldProps) => {
  const label =
    (schema.title as string) ||
    (schema.description as string) ||
    humanizeKey(name);
  const enumValues = schema.enum as string[];

  if (enumValues) {
    const options = enumValues.reduce(
      (acc, val) => {
        acc[String(val)] = String(val);
        return acc;
      },
      {} as Record<string, string>,
    );
    return (
      <SelectField
        name={name}
        id={name}
        label={label}
        options={options}
        disabled={disabled}
      />
    );
  }

  switch (schema.type) {
    case 'boolean':
      return (
        <CheckboxField
          name={name}
          id={name}
          label={label}
          disabled={disabled}
          containerClassName="my-3 flex items-center gap-2"
        />
      );

    case 'number':
    case 'integer':
      return (
        <TextField
          name={name}
          id={name}
          label={label}
          type="number"
          disabled={disabled}
        />
      );

    case 'string':
      return (
        <TextField name={name} id={name} label={label} disabled={disabled} />
      );

    case 'object': {
      const properties = (schema.properties || {}) as Record<
        string,
        Record<string, unknown>
      >;
      return (
        <fieldset className="mt-4 rounded-md border border-border-subtle p-4">
          <legend className="px-2 text-sm font-medium text-text-secondary">
            {label}
          </legend>
          {Object.entries(properties).map(([key, propSchema]) => (
            <SchemaField
              key={key}
              name={`${name}.${key}`}
              schema={propSchema}
              disabled={disabled}
            />
          ))}
        </fieldset>
      );
    }

    default:
      return (
        <JSONAreaField name={name} id={name} label={label} disabled={disabled} />
      );
  }
};

export default SchemaField;
