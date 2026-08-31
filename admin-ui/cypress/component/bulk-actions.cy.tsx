import React, { useState } from 'react';
import { IRoleAction } from '../../src/gql/types';
import AuthContext from '../../src/modules/Auth/AuthContext';
import UserList from '../../src/modules/accounts/components/UserList';
import BulkActionsToolbar from '../../src/modules/common/components/BulkActionsToolbar';
import { BulkActionConfirmation } from '../../src/modules/common/hooks/useBulkActionConfirmation';
import useBulkSelection from '../../src/modules/common/hooks/useBulkSelection';

describe('bulk action safety', () => {
  it('locks form submissions synchronously and forwards submitted data', () => {
    const action = cy.stub().resolves({ failedIds: [] }).as('bulkAction');
    const clear = cy.stub().as('clearSelection');

    cy.mount(
      <BulkActionsToolbar
        selectedCount={1}
        selectedIds={['product-id']}
        onClear={clear}
        onSelectionChange={cy.stub()}
        actions={[
          {
            key: 'tags',
            label: 'Tags',
            renderForm: ({ onSubmit }) => (
              <button
                type="button"
                data-cy="submit-twice"
                onClick={() => {
                  void onSubmit({ add: ['safe'] });
                  void onSubmit({ add: ['safe'] });
                }}
              >
                Submit twice
              </button>
            ),
            onAction: action,
          } as any,
        ]}
      />,
    );

    cy.contains('button', 'Tags').click();
    cy.get('[data-cy="submit-twice"]').click();
    cy.get('@bulkAction').should('have.been.calledOnce');
    cy.get('@bulkAction').should('have.been.calledWith', ['product-id'], {
      add: ['safe'],
    });
    cy.get('@clearSelection').should('have.been.calledOnce');
  });

  it('drops selections that are no longer in the visible result set', () => {
    const Harness = () => {
      const [ids, setIds] = useState(['first']);
      const selection = (useBulkSelection as any)(ids);

      return (
        <div>
          <output data-cy="selected-ids">{selection.selectedIds.join(',')}</output>
          <button type="button" onClick={() => selection.selectAll(ids)}>
            Select visible
          </button>
          <button type="button" onClick={() => setIds(['second'])}>
            Replace results
          </button>
        </div>
      );
    };

    cy.mount(<Harness />);
    cy.contains('button', 'Select visible').click();
    cy.get('[data-cy="selected-ids"]').should('have.text', 'first');
    cy.contains('button', 'Replace results').click();
    cy.get('[data-cy="selected-ids"]').should('have.text', '');
  });

  it('keeps only failed IDs selected after a partial result', () => {
    const replaceSelection = cy.stub().as('replaceSelection');
    const clear = cy.stub().as('partialClear');

    cy.mount(
      <BulkActionsToolbar
        selectedCount={2}
        selectedIds={['succeeded', 'failed']}
        onClear={clear}
        onSelectionChange={replaceSelection}
        actions={[
          {
            key: 'partial',
            label: 'Run partial action',
            onAction: async () => ({
              successCount: 1,
              failedCount: 1,
              failedIds: ['failed'],
            }),
          },
        ]}
      />,
    );

    cy.contains('button', 'Run partial action').click();
    cy.get('@replaceSelection').should('have.been.calledOnceWith', ['failed']);
    cy.get('@partialClear').should('not.have.been.called');
  });

  it('prevents duplicate confirmation callbacks in the same interaction', () => {
    const confirm = cy.stub().resolves({
      successCount: 1,
      failedCount: 0,
      failedIds: [],
    });

    cy.mount(
      <BulkActionConfirmation
        message="Confirm"
        okText="Continue"
        onConfirm={confirm}
        onClose={cy.stub()}
      />,
    );

    cy.get('#danger_continue').then(([button]) => {
      button.click();
      button.click();
    });
    cy.wrap(confirm).should('have.been.calledOnce');
  });

  it('does not expose bulk selection through a legacy manage permission', () => {
    cy.mount(
      <AuthContext.Provider
        value={{
          isAdmin: () => false,
          hasRole: (action) => action === IRoleAction.ManageUsers,
        }}
      >
        <UserList users={[{ _id: 'user-id' } as any]} />
      </AuthContext.Provider>,
    );

    cy.get('input[type="checkbox"]').should('not.exist');
  });

  it('exposes only actions backed by an exact bulk permission', () => {
    cy.mount(
      <AuthContext.Provider
        value={{
          isAdmin: () => false,
          hasRole: (action) => action === IRoleAction.BulkUpdateUserTags,
        }}
      >
        <UserList users={[{ _id: 'user-id' } as any]} />
      </AuthContext.Provider>,
    );

    cy.get('input[type="checkbox"]').first().click();
    cy.contains('button', 'Update Tags').should('exist');
    cy.contains('button', 'Set Roles').should('not.exist');
    cy.contains('button', 'Delete').should('not.exist');
  });
});
