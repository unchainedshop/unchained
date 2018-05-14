import React from 'react';
import { Grid, Segment, Divider } from 'semantic-ui-react';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import PhoneField from '../../lib/FormPhoneInput';
import DateField from '../../lib/FormDateInput';
import UploadAvatar from './UploadAvatarContainer';
import FormTagInput from '../../lib/FormTagInput';

const FormProfile = ({ userId, ...formProps }) => (
  <Segment>
    <AutoForm showInlineError {...formProps} >
      <Grid stackable columns={3}>
        <Grid.Row columns={1}>
          <Grid.Column textAlign="center">
            <Segment basic>
              <UploadAvatar userId={userId} />
            </Segment>
            <Divider />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={2}>
          <Grid.Column width={8}>
            <AutoField name="firstName" />
          </Grid.Column>
          <Grid.Column width={8}>
            <AutoField name="lastName" />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={2}>
          <Grid.Column width={8}>
            <AutoField name="birthday" component={DateField} />
          </Grid.Column>
          <Grid.Column width={8}>
            <AutoField
              name="tags"
              component={FormTagInput}
              options={[]}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={1}>
          <Grid.Column width={16}>
            <AutoField name="phoneMobile" component={PhoneField} country="CH" />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={2}>
          <Grid.Column width={8}>
            <ErrorsField />
            <SubmitField value="Speichern" className="primary" />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </AutoForm>
  </Segment>
);

export default FormProfile;
