export const WorkQueueResponse = {
  data: {
    workQueue: [
      {
        _id: '0a11e5d961579cb5c040f902',
        type: 'SMS',
        scheduled: '2022-07-16T22:04:40.020Z',
        status: 'NEW',
        started: null,
        success: null,
        finished: null,
        created: '2022-07-16T10:42:09.753Z',
        deleted: null,
        priority: 0,
        worker: null,
        input: {
          to: '+41454456656',
          text: 'Deine 1-2-Eat Bestellung #5 musste leider storniert werden und wird dir nicht verrechnet. Grund der Stornierung: Leider konnten wir diese Bestellung nicht mehr während der Öffnungszeiten annehmen.\nWir entschuldigen uns! Dein 1-2-Eat Team.',
        },
        result: null,
        error: null,
        retries: 6,
        original: {
          _id: 'f5b655be9d3e52f0e54e0634',
          __typename: 'Work',
        },
        timeout: null,
        __typename: 'Work',
      },
      {
        _id: '6c273c4156d7ea3fade2e657',
        type: 'SMS',
        scheduled: '2022-07-16T22:04:34.680Z',
        status: 'NEW',
        started: null,
        success: null,
        finished: null,
        created: '2022-07-16T10:42:09.747Z',
        deleted: null,
        priority: 0,
        worker: null,
        input: {
          to: '+41454456656',
          text: 'Deine 1-2-Eat Bestellung #10 musste leider storniert werden und wird dir nicht verrechnet. Grund der Stornierung: Leider konnten wir diese Bestellung nicht mehr während der Öffnungszeiten annehmen.\nWir entschuldigen uns! Dein 1-2-Eat Team.',
        },
        result: null,
        error: null,
        retries: 6,
        original: {
          _id: 'd7e11d56e5e172483c0ea7e1',
          __typename: 'Work',
        },
        timeout: null,
        __typename: 'Work',
      },
      {
        _id: '67d3cb045e5ff8893cd339b9',
        type: 'SMS',
        scheduled: '2022-07-16T22:04:32.938Z',
        status: 'NEW',
        started: null,
        success: null,
        finished: null,
        created: '2022-07-16T10:42:09.739Z',
        deleted: null,
        priority: 0,
        worker: null,
        input: {
          to: '+41454456656',
          text: 'Deine 1-2-Eat Bestellung #4 musste leider storniert werden und wird dir nicht verrechnet. Grund der Stornierung: Leider konnten wir diese Bestellung nicht mehr während der Öffnungszeiten annehmen.\nWir entschuldigen uns! Dein 1-2-Eat Team.',
        },
        result: null,
        error: null,
        retries: 6,
        original: {
          _id: 'd2405c0aa60621d0df991c32',
          __typename: 'Work',
        },
        timeout: null,
        __typename: 'Work',
      },
      {
        _id: 'f9f762646583362c7c75c6b2',
        type: 'SMS',
        scheduled: '2022-07-16T22:04:45.304Z',
        status: 'NEW',
        started: null,
        success: null,
        finished: null,
        created: '2022-07-16T10:42:09.251Z',
        deleted: null,
        priority: 0,
        worker: null,
        input: {
          to: '+41454456656',
          text: 'Deine 1-2-Eat Bestellung #3 musste leider storniert werden und wird dir nicht verrechnet. Grund der Stornierung: Leider konnten wir diese Bestellung nicht mehr während der Öffnungszeiten annehmen.\nWir entschuldigen uns! Dein 1-2-Eat Team.',
        },
        result: null,
        error: null,
        retries: 6,
        original: {
          _id: '55dc14e1a322f801bf6efbcd',
          __typename: 'Work',
        },
        timeout: null,
        __typename: 'Work',
      },
      {
        _id: '52f12ae8f820b7e1587dc840',
        type: 'SMS',
        scheduled: '2022-07-16T10:41:53.170Z',
        status: 'FAILED',
        started: '2022-07-16T10:42:09.269Z',
        success: false,
        finished: '2022-07-16T10:42:09.733Z',
        created: '2022-07-16T05:00:38.036Z',
        deleted: null,
        priority: 0,
        worker: '0161d0e23a8c',
        input: {
          to: '+41454456656',
          text: 'Deine 1-2-Eat Bestellung #5 musste leider storniert werden und wird dir nicht verrechnet. Grund der Stornierung: Leider konnten wir diese Bestellung nicht mehr während der Öffnungszeiten annehmen.\nWir entschuldigen uns! Dein 1-2-Eat Team.',
        },
        result: null,
        error: {
          name: 'Error',
          message: "The 'To' number +41454456656 is not a valid phone number.",
          stack:
            "Error: The 'To' number +41454456656 is not a valid phone number.\n    at success (/webapp/programs/server/npm/node_modules/twilio/lib/base/Version.js:135:15)\n    at Promise_then_fulfilled (/webapp/programs/server/npm/node_modules/q/q.js:766:44)\n    at Promise_done_fulfilled (/webapp/programs/server/npm/node_modules/q/q.js:835:31)\n    at Fulfilled_dispatch [as dispatch] (/webapp/programs/server/npm/node_modules/q/q.js:1229:9)\n    at Pending_become_eachMessage_task (/webapp/programs/server/npm/node_modules/q/q.js:1369:30)\n    at RawTask.call (/webapp/programs/server/npm/node_modules/asap/asap.js:40:19)\n    at flush (/webapp/programs/server/npm/node_modules/asap/raw.js:50:29)\n    at processTicksAndRejections (internal/process/task_queues.js:77:11)\n => awaited here:\n    at Function.Promise.await (/webapp/programs/server/npm/node_modules/meteor/promise/node_modules/meteor-promise/promise_server.js:56:12)\n    at packages/unchained:core-worker/plugins/sms.ts:51:13\n    at /webapp/programs/server/npm/node_modules/meteor/promise/node_modules/meteor-promise/fiber_pool.js:43:40",
        },
        retries: 7,
        original: {
          _id: 'f5b655be9d3e52f0e54e0634',
          __typename: 'Work',
        },
        timeout: null,
        __typename: 'Work',
      },
      {
        _id: 'c5e4e96f3d523b52971f5ce1',
        type: 'SMS',
        scheduled: '2022-07-16T10:41:50.494Z',
        status: 'FAILED',
        started: '2022-07-16T10:42:09.255Z',
        success: false,
        finished: '2022-07-16T10:42:09.729Z',
        created: '2022-07-16T05:00:38.027Z',
        deleted: null,
        priority: 0,
        worker: '0161d0e23a8c',
        input: {
          to: '+41454456656',
          text: 'Deine 1-2-Eat Bestellung #10 musste leider storniert werden und wird dir nicht verrechnet. Grund der Stornierung: Leider konnten wir diese Bestellung nicht mehr während der Öffnungszeiten annehmen.\nWir entschuldigen uns! Dein 1-2-Eat Team.',
        },
        result: null,
        error: {
          name: 'Error',
          message: "The 'To' number +41454456656 is not a valid phone number.",
          stack:
            "Error: The 'To' number +41454456656 is not a valid phone number.\n    at success (/webapp/programs/server/npm/node_modules/twilio/lib/base/Version.js:135:15)\n    at Promise_then_fulfilled (/webapp/programs/server/npm/node_modules/q/q.js:766:44)\n    at Promise_done_fulfilled (/webapp/programs/server/npm/node_modules/q/q.js:835:31)\n    at Fulfilled_dispatch [as dispatch] (/webapp/programs/server/npm/node_modules/q/q.js:1229:9)\n    at Pending_become_eachMessage_task (/webapp/programs/server/npm/node_modules/q/q.js:1369:30)\n    at RawTask.call (/webapp/programs/server/npm/node_modules/asap/asap.js:40:19)\n    at flush (/webapp/programs/server/npm/node_modules/asap/raw.js:50:29)\n    at processTicksAndRejections (internal/process/task_queues.js:77:11)\n => awaited here:\n    at Function.Promise.await (/webapp/programs/server/npm/node_modules/meteor/promise/node_modules/meteor-promise/promise_server.js:56:12)\n    at packages/unchained:core-worker/plugins/sms.ts:51:13\n    at /webapp/programs/server/npm/node_modules/meteor/promise/node_modules/meteor-promise/fiber_pool.js:43:40",
        },
        retries: 7,
        original: {
          _id: 'd7e11d56e5e172483c0ea7e1',
          __typename: 'Work',
        },
        timeout: null,
        __typename: 'Work',
      },
      {
        _id: '5949ed1ca156371beb83b788',
        type: 'SMS',
        scheduled: '2022-07-16T10:41:49.621Z',
        status: 'FAILED',
        started: '2022-07-16T10:42:09.253Z',
        success: false,
        finished: '2022-07-16T10:42:09.726Z',
        created: '2022-07-16T05:00:38.021Z',
        deleted: null,
        priority: 0,
        worker: '0161d0e23a8c',
        input: {
          to: '+41454456656',
          text: 'Deine 1-2-Eat Bestellung #4 musste leider storniert werden und wird dir nicht verrechnet. Grund der Stornierung: Leider konnten wir diese Bestellung nicht mehr während der Öffnungszeiten annehmen.\nWir entschuldigen uns! Dein 1-2-Eat Team.',
        },
        result: null,
        error: {
          name: 'Error',
          message: "The 'To' number +41454456656 is not a valid phone number.",
          stack:
            "Error: The 'To' number +41454456656 is not a valid phone number.\n    at success (/webapp/programs/server/npm/node_modules/twilio/lib/base/Version.js:135:15)\n    at Promise_then_fulfilled (/webapp/programs/server/npm/node_modules/q/q.js:766:44)\n    at Promise_done_fulfilled (/webapp/programs/server/npm/node_modules/q/q.js:835:31)\n    at Fulfilled_dispatch [as dispatch] (/webapp/programs/server/npm/node_modules/q/q.js:1229:9)\n    at Pending_become_eachMessage_task (/webapp/programs/server/npm/node_modules/q/q.js:1369:30)\n    at RawTask.call (/webapp/programs/server/npm/node_modules/asap/asap.js:40:19)\n    at flush (/webapp/programs/server/npm/node_modules/asap/raw.js:50:29)\n    at processTicksAndRejections (internal/process/task_queues.js:77:11)\n => awaited here:\n    at Function.Promise.await (/webapp/programs/server/npm/node_modules/meteor/promise/node_modules/meteor-promise/promise_server.js:56:12)\n    at packages/unchained:core-worker/plugins/sms.ts:51:13\n    at /webapp/programs/server/npm/node_modules/meteor/promise/node_modules/meteor-promise/fiber_pool.js:43:40",
        },
        retries: 7,
        original: {
          _id: 'd2405c0aa60621d0df991c32',
          __typename: 'Work',
        },
        timeout: null,
        __typename: 'Work',
      },
      {
        _id: 'd8ad9bd926e39aa3d2b2c01e',
        type: 'SMS',
        scheduled: '2022-07-16T10:41:55.575Z',
        status: 'FAILED',
        started: '2022-07-16T10:42:08.678Z',
        success: false,
        finished: '2022-07-16T10:42:09.234Z',
        created: '2022-07-16T05:00:37.548Z',
        deleted: null,
        priority: 0,
        worker: '0161d0e23a8c',
        input: {
          to: '+41454456656',
          text: 'Deine 1-2-Eat Bestellung #3 musste leider storniert werden und wird dir nicht verrechnet. Grund der Stornierung: Leider konnten wir diese Bestellung nicht mehr während der Öffnungszeiten annehmen.\nWir entschuldigen uns! Dein 1-2-Eat Team.',
        },
        result: null,
        error: {
          name: 'Error',
          message: "The 'To' number +41454456656 is not a valid phone number.",
          stack:
            "Error: The 'To' number +41454456656 is not a valid phone number.\n    at success (/webapp/programs/server/npm/node_modules/twilio/lib/base/Version.js:135:15)\n    at Promise_then_fulfilled (/webapp/programs/server/npm/node_modules/q/q.js:766:44)\n    at Promise_done_fulfilled (/webapp/programs/server/npm/node_modules/q/q.js:835:31)\n    at Fulfilled_dispatch [as dispatch] (/webapp/programs/server/npm/node_modules/q/q.js:1229:9)\n    at Pending_become_eachMessage_task (/webapp/programs/server/npm/node_modules/q/q.js:1369:30)\n    at RawTask.call (/webapp/programs/server/npm/node_modules/asap/asap.js:40:19)\n    at flush (/webapp/programs/server/npm/node_modules/asap/raw.js:50:29)\n    at processTicksAndRejections (internal/process/task_queues.js:77:11)\n => awaited here:\n    at Function.Promise.await (/webapp/programs/server/npm/node_modules/meteor/promise/node_modules/meteor-promise/promise_server.js:56:12)\n    at packages/unchained:core-worker/plugins/sms.ts:51:13\n    at /webapp/programs/server/npm/node_modules/meteor/promise/node_modules/meteor-promise/fiber_pool.js:43:40",
        },
        retries: 7,
        original: {
          _id: '55dc14e1a322f801bf6efbcd',
          __typename: 'Work',
        },
        timeout: null,
        __typename: 'Work',
      },
      {
        _id: 'c65003124fef5b4baea36582',
        type: 'SMS',
        scheduled: '2022-07-31T07:14:20.755Z',
        status: 'NEW',
        started: null,
        success: null,
        finished: null,
        created: '2022-07-16T03:17:37.101Z',
        deleted: null,
        priority: 0,
        worker: null,
        input: {
          to: '+41456456456',
          text: 'Deine 1-2-Eat Bestellung #1 musste leider storniert werden und wird dir nicht verrechnet. Grund der Stornierung: Leider konnten wir diese Bestellung nicht mehr während der Öffnungszeiten annehmen.\nWir entschuldigen uns! Dein 1-2-Eat Team.',
        },
        result: null,
        error: null,
        retries: 1,
        original: {
          _id: 'c6bb5e0f8904d1b4a13228ae',
          __typename: 'Work',
        },
        timeout: null,
        __typename: 'Work',
      },
      {
        _id: '38f6668fb594aff9df8b8840',
        type: 'SMS',
        scheduled: '2022-07-16T05:00:14.933Z',
        status: 'FAILED',
        started: '2022-07-16T05:00:37.558Z',
        success: false,
        finished: '2022-07-16T05:00:38.025Z',
        created: '2022-07-16T02:09:37.366Z',
        deleted: null,
        priority: 0,
        worker: '0161d0e23a8c',
        input: {
          to: '+41454456656',
          text: 'Deine 1-2-Eat Bestellung #5 musste leider storniert werden und wird dir nicht verrechnet. Grund der Stornierung: Leider konnten wir diese Bestellung nicht mehr während der Öffnungszeiten annehmen.\nWir entschuldigen uns! Dein 1-2-Eat Team.',
        },
        result: null,
        error: {
          name: 'Error',
          message: "The 'To' number +41454456656 is not a valid phone number.",
          stack:
            "Error: The 'To' number +41454456656 is not a valid phone number.\n    at success (/webapp/programs/server/npm/node_modules/twilio/lib/base/Version.js:135:15)\n    at Promise_then_fulfilled (/webapp/programs/server/npm/node_modules/q/q.js:766:44)\n    at Promise_done_fulfilled (/webapp/programs/server/npm/node_modules/q/q.js:835:31)\n    at Fulfilled_dispatch [as dispatch] (/webapp/programs/server/npm/node_modules/q/q.js:1229:9)\n    at Pending_become_eachMessage_task (/webapp/programs/server/npm/node_modules/q/q.js:1369:30)\n    at RawTask.call (/webapp/programs/server/npm/node_modules/asap/asap.js:40:19)\n    at flush (/webapp/programs/server/npm/node_modules/asap/raw.js:50:29)\n    at processTicksAndRejections (internal/process/task_queues.js:77:11)\n => awaited here:\n    at Function.Promise.await (/webapp/programs/server/npm/node_modules/meteor/promise/node_modules/meteor-promise/promise_server.js:56:12)\n    at packages/unchained:core-worker/plugins/sms.ts:51:13\n    at /webapp/programs/server/npm/node_modules/meteor/promise/node_modules/meteor-promise/fiber_pool.js:43:40",
        },
        retries: 8,
        original: {
          _id: 'f5b655be9d3e52f0e54e0634',
          __typename: 'Work',
        },
        timeout: null,
        __typename: 'Work',
      },
    ],
    activeWorkTypes: [
      'EMAIL',
      'MARK_ORDER_DELIVERED',
      'MESSAGE',
      'ORDERLY_KITCHEN_CLOSE',
      'SMS',
    ],
    workQueueCount: 510,
  },
};

export const NewWorkResponse = {
  data: {
    work: {
      _id: '0a11e5d961579cb5c040f902',
      type: 'SMS',
      scheduled: '2022-07-16T22:04:40.020Z',
      status: 'NEW',
      started: null,
      success: null,
      finished: null,
      created: '2022-07-16T10:42:09.753Z',
      deleted: null,
      priority: 0,
      worker: null,
      input: {
        to: '+41454456656',
        text: 'Deine 1-2-Eat Bestellung #5 musste leider storniert werden und wird dir nicht verrechnet. Grund der Stornierung: Leider konnten wir diese Bestellung nicht mehr während der Öffnungszeiten annehmen.\nWir entschuldigen uns! Dein 1-2-Eat Team.',
      },
      result: null,
      error: null,
      retries: 6,
      original: {
        _id: 'f5b655be9d3e52f0e54e0634',
        __typename: 'Work',
      },
      timeout: null,
      __typename: 'Work',
    },
  },
};

export const SuccessResponse = {
  data: {
    work: {
      _id: '0756f102e807d0ee0443f166',
      type: 'MESSAGE',
      scheduled: '2022-06-17T13:35:13.672Z',
      status: 'SUCCESS',
      started: '2022-06-17T13:35:13.693Z',
      success: true,
      finished: '2022-06-17T13:35:13.706Z',
      created: '2022-06-17T13:35:13.679Z',
      deleted: null,
      priority: 0,
      worker: '4e19b28b1803',
      input: {
        paymentContext: {
          transactionId: '220617153444159337',
        },
        locale: {
          code: 'de-CH',
          language: 'de',
          country: 'CH',
          normalized: 'de-CH',
          score: 1,
          defaulted: false,
        },
        template: 'ORDER_CONFIRMATION',
        orderId: 'b0dda407aba6a9d08c8387e7',
      },
      result: {
        info: 'Skipped Message',
      },
      error: null,
      retries: 0,
      original: null,
      timeout: null,
      __typename: 'Work',
    },
  },
};

export const FailedResponse = {
  data: {
    work: {
      _id: '52f12ae8f820b7e1587dc840',
      type: 'SMS',
      scheduled: '2022-07-16T10:41:53.170Z',
      status: 'FAILED',
      started: '2022-07-16T10:42:09.269Z',
      success: false,
      finished: '2022-07-16T10:42:09.733Z',
      created: '2022-07-16T05:00:38.036Z',
      deleted: null,
      priority: 0,
      worker: '0161d0e23a8c',
      input: {
        to: '+41454456656',
        text: 'Deine 1-2-Eat Bestellung #5 musste leider storniert werden und wird dir nicht verrechnet. Grund der Stornierung: Leider konnten wir diese Bestellung nicht mehr während der Öffnungszeiten annehmen.\nWir entschuldigen uns! Dein 1-2-Eat Team.',
      },
      result: null,
      error: {
        name: 'Error',
        message: "The 'To' number +41454456656 is not a valid phone number.",
        stack:
          "Error: The 'To' number +41454456656 is not a valid phone number.\n    at success (/webapp/programs/server/npm/node_modules/twilio/lib/base/Version.js:135:15)\n    at Promise_then_fulfilled (/webapp/programs/server/npm/node_modules/q/q.js:766:44)\n    at Promise_done_fulfilled (/webapp/programs/server/npm/node_modules/q/q.js:835:31)\n    at Fulfilled_dispatch [as dispatch] (/webapp/programs/server/npm/node_modules/q/q.js:1229:9)\n    at Pending_become_eachMessage_task (/webapp/programs/server/npm/node_modules/q/q.js:1369:30)\n    at RawTask.call (/webapp/programs/server/npm/node_modules/asap/asap.js:40:19)\n    at flush (/webapp/programs/server/npm/node_modules/asap/raw.js:50:29)\n    at processTicksAndRejections (internal/process/task_queues.js:77:11)\n => awaited here:\n    at Function.Promise.await (/webapp/programs/server/npm/node_modules/meteor/promise/node_modules/meteor-promise/promise_server.js:56:12)\n    at packages/unchained:core-worker/plugins/sms.ts:51:13\n    at /webapp/programs/server/npm/node_modules/meteor/promise/node_modules/meteor-promise/fiber_pool.js:43:40",
      },
      retries: 7,
      original: {
        _id: 'f5b655be9d3e52f0e54e0634',
        __typename: 'Work',
      },
      timeout: null,
      __typename: 'Work',
    },
  },
};

export const AllocatedWorkResponse = {
  data: {
    work: {
      _id: 'd8ad9bd926e39aa3d2b2c01e',
      type: 'PUBLICARE_SYNC',
      scheduled: 1657612800000,
      status: 'ALLOCATED',
      started: 1657612815826,
      success: null,
      finished: null,
      created: 1657598445693,
      deleted: null,
      priority: 0,
      worker: '8023fea0dd8c:CRON',
      input: {
        options: {
          logPath: '/unchained-sync-catalog-logs',
        },
      },
      result: null,
      error: null,
      retries: 0,
      original: null,
      timeout: null,
      __typename: 'Work',
    },
  },
};

export const DeleteResponse = {
  data: {
    work: {
      _id: '0a11e5d961579cb5c040f902',
      type: 'SMS',
      scheduled: '2022-07-16T22:04:40.020Z',
      status: 'DELETED',
      started: null,
      success: null,
      finished: null,
      created: '2022-07-16T10:42:09.753Z',
      deleted: '2022-07-16T17:53:46.068Z',
      priority: 0,
      worker: null,
      input: {
        to: '+41454456656',
        text: 'Deine 1-2-Eat Bestellung #5 musste leider storniert werden und wird dir nicht verrechnet. Grund der Stornierung: Leider konnten wir diese Bestellung nicht mehr während der Öffnungszeiten annehmen.\nWir entschuldigen uns! Dein 1-2-Eat Team.',
      },
      result: null,
      error: null,
      retries: 6,
      original: {
        _id: 'f5b655be9d3e52f0e54e0634',
        __typename: 'Work',
      },
      timeout: null,
      __typename: 'Work',
    },
  },
};

export const DeleteWorkResponse = {
  data: {
    removeWork: {
      _id: '0a11e5d961579cb5c040f902',
      __typename: 'Work',
    },
  },
};

export const AddWorkResponse = {
  data: {
    addWork: {
      _id: '08831a11c0326c7987f1acb2',
      __typename: 'Work',
    },
  },
};

export const WorkOperations = {
  GetWorkQueue: 'WorkQueue',
  GetWork: 'Work',
  AddWork: 'AddWork',
  GetWorkTypes: 'WorkTypes',
  AllocateWork: 'AllocateWork',
};

export const WorkTypesResponse = {
  data: {
    registeredWorkTypes: {
      options: [
        {
          value: 'UNKNOWN',
          label: 'UNKNOWN',
          __typename: '__EnumValue',
        },
        {
          value: 'ENROLLMENT_ORDER_GENERATOR',
          label: 'ENROLLMENT_ORDER_GENERATOR',
          __typename: '__EnumValue',
        },
        {
          value: 'BULK_IMPORT',
          label: 'BULK_IMPORT',
          __typename: '__EnumValue',
        },
        {
          value: 'ZOMBIE_KILLER',
          label: 'ZOMBIE_KILLER',
          __typename: '__EnumValue',
        },
        {
          value: 'MESSAGE',
          label: 'MESSAGE',
          __typename: '__EnumValue',
        },
        {
          value: 'ORDERLY_KITCHEN_CLOSE',
          label: 'ORDERLY_KITCHEN_CLOSE',
          __typename: '__EnumValue',
        },
      ],
      __typename: '__Type',
    },
  },
};

const WorkMocks = {
  WorkOperations,
  WorkQueueResponse,
  FailedResponse,
  SuccessResponse,
  NewWorkResponse,
  DeleteResponse,
  DeleteWorkResponse,
  AllocatedWorkResponse,
  AddWorkResponse,
  WorkTypesResponse,
};

export default WorkMocks;
