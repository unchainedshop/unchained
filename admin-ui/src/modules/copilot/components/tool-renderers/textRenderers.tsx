import TextsList from '../TextsList';

export const renderTexts = (toolName) => {
  const RenderedTexts = (data: any) =>
    data?.texts ? <TextsList tool={toolName} {...data} /> : null;

  RenderedTexts.displayName = `RenderTexts(${toolName})`;
  return RenderedTexts;
};
