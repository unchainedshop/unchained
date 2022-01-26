export const contextFields = {
  context: {
    type: Object,
    blackbox: true,
    required: false,
  },
};

export const logFields = {
  log: Array,
  'log.$': {
    type: Object,
  },
  'log.$.date': {
    type: Date,
  },
  'log.$.status': {
    type: String,
  },
  'log.$.info': {
    type: String,
  },
};

export const timestampFields = {
  created: { type: Date, required: true },
  createdBy: { type: String }, // Logically it is required but for backwards compatibility it's set to optional
  updated: { type: Date },
  updatedBy: { type: String },
  deleted: { type: Date },
  deletedBy: { type: String },
};
