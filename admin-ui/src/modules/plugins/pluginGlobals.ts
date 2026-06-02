import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { gql } from '@apollo/client';
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

declare global {
  interface Window {
    __UNCHAINED_PLUGIN_DEPS__: Record<string, any>;
    __UNCHAINED_PLUGINS__: Record<string, Record<string, any>>;
  }
}

if (typeof window !== 'undefined') {
  window.__UNCHAINED_PLUGIN_DEPS__ = {
    react: React,
    'react/jsx-runtime': jsxRuntime,
    '@apollo/client': { gql, useQuery, useMutation, useApolloClient },
    '@apollo/client/react': { useQuery, useMutation, useApolloClient },
    'next/router': { useRouter },
    'react-intl': { useIntl },
    'react-toastify': { toast },
  };
  window.__UNCHAINED_PLUGINS__ = window.__UNCHAINED_PLUGINS__ || {};
}

export {};
