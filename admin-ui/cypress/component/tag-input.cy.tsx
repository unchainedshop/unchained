import TagInput from '../../src/components/ui/Tag/TagInput';
import BulkTagForm from '../../src/modules/common/components/BulkTagForm';

const existingTagOptions = [
  { label: 'premium', value: 'premium' },
  { label: 'preorder', value: 'preorder' },
];

describe('tag suggestions', () => {
  it('shows existing tags before the create option', () => {
    cy.mount(
      <TagInput
        tagList={[]}
        onChange={cy.stub()}
        selectOptions={existingTagOptions}
      />,
    );

    cy.get('#tag-input').type('pre');
    cy.get('[role="listbox"] [role="option"]')
      .first()
      .should('have.text', 'premium');
    cy.get('[role="listbox"] [role="option"]')
      .last()
      .should('contain.text', 'Add "pre"');
  });

  it('reuses the canonical existing tag for a case-insensitive match', () => {
    const onChange = cy.stub().as('tagChange');
    cy.mount(
      <TagInput
        tagList={[]}
        onChange={onChange}
        selectOptions={existingTagOptions}
      />,
    );

    cy.get('#tag-input').type('PREMIUM{enter}');
    cy.get('@tagChange').should('have.been.calledOnceWith', ['premium']);
  });

  it('selects an existing suggestion on enter instead of creating a partial tag', () => {
    const onChange = cy.stub().as('suggestedTagChange');
    cy.mount(
      <TagInput
        tagList={[]}
        onChange={onChange}
        selectOptions={existingTagOptions}
      />,
    );

    cy.get('#tag-input').type('prem{enter}');
    cy.get('@suggestedTagChange').should('have.been.calledOnceWith', [
      'premium',
    ]);
  });

  it('offers existing tags during bulk updates', () => {
    const onSubmit = cy.stub().as('bulkTagSubmit');
    cy.mount(
      <BulkTagForm
        onSubmit={onSubmit}
        onCancel={cy.stub()}
        availableTagOptions={existingTagOptions}
      />,
    );

    cy.get('#bulk-add-tags').click();
    cy.contains('[role="option"]', 'premium').click();
    cy.contains('button', 'Apply').click();

    cy.get('@bulkTagSubmit').should('have.been.calledOnceWith', {
      add: ['premium'],
      remove: undefined,
    });
  });
});
