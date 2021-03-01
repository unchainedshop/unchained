import fetch from 'isomorphic-unfetch';
import { subscribe } from '../director';

subscribe('PAGE_VIEW', async (e) => {
  const data = await fetch(
    `https://matomo.ucc.dev/matomo.php?idsite=1&rec=1&action_name=${e.payload.path}`
  );
});
