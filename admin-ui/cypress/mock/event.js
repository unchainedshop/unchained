export const EventsListResponse = {
  data: {
    events: [
      {
        _id: '5ad8fc0fe7251c5765748e65',
        type: 'WAREHOUSING_PROVIDER_UPDATE',
        payload: {
          warehousingProvider: {
            _id: '27fd3343a04758f31100c01b',
            configuration: [
              {
                key: 'sector',
                value: 'B',
              },
              {
                key: 'online',
                value: 'false',
              },
            ],
            type: 'PHYSICAL',
            adapterKey: 'ch.test.clerk',
            authorId: 'BKHrbTkHeGRtou5kc',
            created: '2022-06-23T11:38:09.649Z',
            createdBy: 'BKHrbTkHeGRtou5kc',
            updated: '2022-07-11T23:16:10.789Z',
            updatedBy: 'BKHrbTkHeGRtou5kc',
          },
        },
        created: 1657581370798,
        __typename: 'Event',
      },
      {
        _id: '7fcb5c058bac584628f76495',
        type: 'WAREHOUSING_PROVIDER_UPDATE',
        payload: {
          warehousingProvider: {
            _id: '0167c4fde8e06c54f26532a2',
            configuration: [
              {
                key: 'sector',
                value: 'A',
              },
              {
                key: 'online',
                value: 'false',
              },
            ],
            type: 'PHYSICAL',
            adapterKey: 'ch.test.clerk',
            authorId: 'BKHrbTkHeGRtou5kc',
            created: '2022-03-17T11:43:35.495Z',
            createdBy: 'BKHrbTkHeGRtou5kc',
            updated: '2022-07-11T23:16:10.782Z',
            updatedBy: 'qDVQR5jPfcnqMsbYJ',
          },
        },
        created: 1657581370795,
        __typename: 'Event',
      },
      {
        _id: '747b48544a38692cb906e055',
        type: 'WAREHOUSING_PROVIDER_UPDATE',
        payload: {
          warehousingProvider: {
            _id: '0167c4fde8e06c54f26532a2',
            configuration: [
              {
                key: 'sector',
                value: 'A',
              },
              {
                key: 'online',
                value: 'false',
              },
            ],
            type: 'PHYSICAL',
            adapterKey: 'ch.test.clerk',
            authorId: 'BKHrbTkHeGRtou5kc',
            created: '2022-03-17T11:43:35.495Z',
            createdBy: 'BKHrbTkHeGRtou5kc',
            updated: '2022-07-11T22:51:47.205Z',
            updatedBy: 'qDVQR5jPfcnqMsbYJ',
          },
        },
        created: 1657579907212,
        __typename: 'Event',
      },
      {
        _id: '27203f11e3b6cec54e34898f',
        type: 'WAREHOUSING_PROVIDER_UPDATE',
        payload: {
          warehousingProvider: {
            _id: '0167c4fde8e06c54f26532a2',
            configuration: [
              {
                key: 'sector',
                value: 'A',
              },
              {
                key: 'online',
                value: 'false',
              },
            ],
            type: 'PHYSICAL',
            adapterKey: 'ch.test.clerk',
            authorId: 'BKHrbTkHeGRtou5kc',
            created: '2022-03-17T11:43:35.495Z',
            createdBy: 'BKHrbTkHeGRtou5kc',
            updated: '2022-07-11T22:51:47.081Z',
            updatedBy: 'qDVQR5jPfcnqMsbYJ',
          },
        },
        created: 1657579907095,
        __typename: 'Event',
      },
    ],
    eventsCount: 4,
  },
};

export const SingleEventResponse = {
  data: {
    event: {
      _id: '5ad8fc0fe7251c5765748e65',
      type: 'WAREHOUSING_PROVIDER_UPDATE',
      payload: {
        warehousingProvider: {
          _id: '27fd3343a04758f31100c01b',
          configuration: [
            {
              key: 'sector',
              value: 'B',
            },
            {
              key: 'online',
              value: 'false',
            },
          ],
          type: 'PHYSICAL',
          adapterKey: 'ch.test.clerk',
          authorId: 'BKHrbTkHeGRtou5kc',
          created: '2022-06-23T11:38:09.649Z',
          createdBy: 'BKHrbTkHeGRtou5kc',
          updated: '2022-07-11T23:16:10.789Z',
          updatedBy: 'BKHrbTkHeGRtou5kc',
        },
      },
      created: 1657581370798,
      __typename: 'Event',
    },
  },
};

export const EventsTypeResponse = {
  data: {
    eventTypes: {
      options: [
        {
          value: 'UNKNOWN',
          label: 'UNKNOWN',
          __typename: '__EnumValue',
        },
        {
          value: 'PAGE_VIEW',
          label: 'PAGE_VIEW',
          __typename: '__EnumValue',
        },
        {
          value: 'ASSORTMENT_CREATE',
          label: 'ASSORTMENT_CREATE',
          __typename: '__EnumValue',
        },
        {
          value: 'ASSORTMENT_REMOVE',
          label: 'ASSORTMENT_REMOVE',
          __typename: '__EnumValue',
        },
        {
          value: 'ASSORTMENT_SET_BASE',
          label: 'ASSORTMENT_SET_BASE',
          __typename: '__EnumValue',
        },
        {
          value: 'ASSORTMENT_UPDATE',
          label: 'ASSORTMENT_UPDATE',
          __typename: '__EnumValue',
        },
        {
          value: 'ASSORTMENT_ADD_FILTER',
          label: 'ASSORTMENT_ADD_FILTER',
          __typename: '__EnumValue',
        },
      ],
      __typename: '__Type',
    },
  },
};

export const EventOperations = {
  GetEventList: 'Events',
  GetSingleEvent: 'Event',
  GetEventTypes: 'EventsType',
};

const EventMocks = {
  EventsListResponse,
  SingleEventResponse,
  EventsTypeResponse,
};

export default EventMocks;
