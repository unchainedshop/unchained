import fetch from 'isomorphic-unfetch';
import { encode } from 'querystring';
import { subscribe } from '../director';

const MatomoTracker = (siteId, siteUrl, subscribeTo, options = {}) => {
  if (!siteId && (typeof siteId !== 'number' || siteId !== 'string'))
    throw new Error('Matomo siteId is required');
  if (!siteUrl && typeof siteUrl !== 'string')
    throw new Error('Matomo tracker URL is required');
  if (!subscribeTo && typeof subscribeTo !== 'string')
    throw new Error('Event that triggers tracking should be provided');
  subscribe(subscribeTo, async (e) => {
    await fetch(
      `${siteUrl}?idsite=${siteId}&rec=1&action_name=${e.payload.path}&${encode(
        options
      )}`
    );
  });
};

export default MatomoTracker;
