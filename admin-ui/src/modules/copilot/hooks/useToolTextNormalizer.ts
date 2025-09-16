import { useCallback } from 'react';
import { useIntl } from 'react-intl';

export type ToolName = any;
const useToolTextNormalizer = () => {
  const { formatMessage } = useIntl();

  const normalizeToolName = (toolName: ToolName | string): string => {
    if (!toolName) return '';

    const parts = toolName.split('_');
    if (parts.length !== 2) return toolName;

    const [rawSubject, rawAction] = parts;
    const splitCamelCase = (str: string): string[] =>
      str
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(capitalize);

    const match = rawAction.match(/^([a-z]+)(.*)$/);
    const verb = match?.[1] ?? rawAction;
    const action = match?.[2] ?? '';

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const subject = splitCamelCase(rawSubject);
    const word = action ? capitalize(action) : '';

    return `${capitalize(verb)} ${subject.join(' ')}${word ? ` ${word}` : ''}`;
  };

  const getToolDescription = useCallback(
    (toolName: string): string => {
      const name = toolName.toLowerCase();

      const TOOL_TO_DESCRIPTION_MATCH: Partial<Record<ToolName, string>> = {
        product_management: formatMessage({
          id: 'list_product_tool_definition',
          defaultMessage: 'Show me all draft products',
        }),
      };
      if (TOOL_TO_DESCRIPTION_MATCH[name]) {
        return `"${TOOL_TO_DESCRIPTION_MATCH[name]}"`;
      }
      if (name.includes('assortment'))
        return formatMessage({
          id: 'assortment_management_tool_definition',
          defaultMessage: '"Manage product categories"',
        });
      if (name.includes('media') && name.includes('remove'))
        return formatMessage({
          id: 'media_remover_tool_definition',
          defaultMessage: '"Remove media files"',
        });
      if (name.includes('media') && name.includes('add'))
        return formatMessage({
          id: 'media_add_tool_definition',
          defaultMessage: '"Add media files"',
        });
      if (name.includes('media'))
        return formatMessage({
          id: 'media_management_tool_definition',
          defaultMessage: '"Manage media files"',
        });

      return formatMessage(
        {
          id: 'general_tool_definition',
          defaultMessage: `"Help me with {toolName}"`,
        },
        { toolName: normalizeToolName(toolName) },
      );
    },
    [formatMessage],
  );

  return {
    getToolDescription,
    normalizeToolName,
  };
};

export default useToolTextNormalizer;
