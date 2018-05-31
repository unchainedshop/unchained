import React from 'react';
import { Grid, Segment, Divider } from 'semantic-ui-react';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import PhoneField from '../../lib/FormPhoneInput';
import DateField from '../../lib/FormDateInput';
import UploadAvatar from './UploadAvatarContainer';

const FormProfile = ({ userId, ...formProps }) => (
  <Segment>
    <AutoForm showInlineError {...formProps} >
      <Grid stackable columns={4}>
        <Grid.Row columns={1}>
          <Grid.Column textAlign="center">
            <Segment basic>
              <UploadAvatar userId={userId} />
            </Segment>
            <Divider />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={1}>
          <Grid.Column width={16}>
            <AutoField name="displayName" />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={4}>
          <Grid.Column width={4}>
            <AutoField name="gender" />
          </Grid.Column>
          <Grid.Column width={4}>
            <AutoField name="birthday" component={DateField} />
          </Grid.Column>
          <Grid.Column width={8}>
            <AutoField name="phoneMobile" component={PhoneField} country="CH" />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={1}>
          <Grid.Column width={16}>
            <label htmlFor="address.firstName">Address</label>
            <Segment>
              <Grid stackable columns={1}>
                <Grid.Row columns={2}>
                  <Grid.Column width={8}>
                    <AutoField name="address.firstName" />
                  </Grid.Column>
                  <Grid.Column width={8}>
                    <AutoField name="address.lastName" />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={1}>
                  <Grid.Column width={16}>
                    <AutoField name="address.company" />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={1}>
                  <Grid.Column width={16}>
                    <AutoField name="address.addressLine" />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={1}>
                  <Grid.Column width={16}>
                    <AutoField name="address.addressLine2" />
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={4}>
                  <Grid.Column width={4}>
                    <AutoField name="address.regionCode" />
                  </Grid.Column>
                  <Grid.Column width={4}>
                    <AutoField name="address.postalCode" />
                  </Grid.Column>
                  <Grid.Column width={8}>
                    <AutoField name="address.city" />
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Segment>
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
