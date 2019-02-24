/* eslint-disable import/prefer-default-export */
import get from 'lodash.get';

export const getSetting = (path, defaultValue) => get(Meteor.settings.unchained, path, defaultValue);
