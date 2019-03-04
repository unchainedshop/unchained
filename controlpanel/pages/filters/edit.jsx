import React from 'react';
import { withRouter } from 'next/router';
import { Grid, Container, Header } from 'semantic-ui-react';
import App from '../../components/App';
import FilterOptionList from '../../components/filters/FilterOptionList'; // eslint-disable-line
import FilterHeader from '../../components/filters/FilterHeader';
import FilterMenu from '../../components/filters/FilterMenu';
import FormEditFilterTexts from '../../components/filters/FormEditFilterTexts';
import connectApollo from '../../lib/connectApollo';

export default connectApollo(
  withRouter(({ changeTab, router, ...rest }) => (
    <App {...rest}>
      <Container>
        <Grid>
          <Grid.Row>
            <Grid.Column stretched>
              <FilterHeader filterId={router.query._id} />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={3}>
              <FilterMenu router={router} filterId={router.query._id} />
            </Grid.Column>
            <Grid.Column stretched width={13}>
              {(!router.query.tab ||
                router.query.tab === 'FilterTranslation') && (
                <div>
                  <Header as="h3">Texts</Header>
                  <FormEditFilterTexts
                    filterId={router.query._id}
                    filterOptionValue={null}
                  />
                </div>
              )}
              {router.query.tab === 'FilterOptions' && (
                <div>
                  <Header as="h3">Options</Header>
                  <FilterOptionList filterId={router.query._id} />
                </div>
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    </App>
  ))
);
