export const contextFields = {
  context: {
    type: Object,
    blackbox: true,
    required: false
  }
};

export const logFields = {
  log: Array,
  'log.$': {
    type: Object
  },
  'log.$.date': {
    type: Date
  },
  'log.$.status': {
    type: String
  },
  'log.$.info': {
    type: String
  }
};

export const timestampFields = {
  created: { type: Date, required: true },
  updated: { type: Date, required: false },
  deleted: { type: Date, required: false }
};
