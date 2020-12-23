import React, { useState } from 'react';
import { Container } from 'semantic-ui-react';
import App from '../../components/App';
import WorkList from '../../components/work/WorkList';
import connectApollo from '../../lib/connectApollo';
import useWorkTypes from '../../lib/useWorkTypes';

const getSelectedOptions = (e) => {
return Array.from(e.target.selectedOptions, option => option.value);
}
export default connectApollo(({ ...rest }) => {
  const [recentWorkTypeFilter, setRecentWorkTypeFilter ] = useState([]);
  const [currentWorkTypeFilter, setCurrentWorkTypeFilter ] = useState(['FAILED', 'SUCCESS']);
  const {workTypes} = useWorkTypes()
  const onRecentTypeChange = (e) => {
      let value = getSelectedOptions(e)
      setRecentWorkTypeFilter(value);
  }

  const onRecentStatusChange = (e) => {
      let value = getSelectedOptions(e);
      setCurrentWorkTypeFilter(value);
  }
  return <App {...rest}>
          <Container>
            <h2>Next in Queue</h2>
            <WorkList
              queryOptions={{ pollInterval: 1000 }}
              limit={0}
              selectTypes={[]}
              status={['ALLOCATED', 'NEW']}
            />

            <h2>Most Recently Finished</h2>
            <select multiple onChange={onRecentTypeChange} >
            {workTypes.map(({_id: type}) => <option key={`recent_${type}`} value={type}> {type} </option>)}
            </select>
            <select multiple onChange={onRecentStatusChange} >
            <option value="FAILED" selected > FAILED </option>
            <option value="SUCCESS" selected > SUCCESS </option>
            </select>
            <WorkList
              queryOptions={{ pollInterval: 5000 }}
              status={currentWorkTypeFilter}
              selectTypes={recentWorkTypeFilter}
            />
          </Container>
        </App>
}
);
