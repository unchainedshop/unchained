import { WorkStatus } from 'meteor/unchained:core-worker';

export default [
  /* GraphQL */ `
    enum WorkStatus {
      ${Object.keys(WorkStatus).join(',')}
    }

    # This is just a placeholder. Extend WorkType with the active plugins on
    # startup. See /examples/minimal/boot.js:92
    enum WorkType

    type WorkOutput {
      result: JSON
      error: JSON
      success: Boolean!
    }

    type Work {
      _id: ID!
      # Timestamp when this work was allocated -> Locked for other workers
      started: Date

      stopped: Date
      created: Date!
      updated: Date
      deleted: Date

      priority: Int
      type: WorkType!

      # Status is derived from the other fields. E.g. Work without \`started\`
      # field has status \`NEW\`
      status: WorkStatus!

      worker: String      
      input: JSON
      result: JSON

      # Work can have errors recorded, but nonetheless be marked as \`success\`
      error: JSON
      success: Boolean

      # If set, the work will not be allocated before this date
      scheduled: Date

      # Link to original work: For retries, clones, ...
      original: ID

      # How many times this work should be retried. A retried work is a clone
      # with \`retries = parent.retries - 1\` usually. Plugins can implement 
      # different workflows.
      retries: Int

      # If work is \`ALLOCATED\` longer than \`timeout\` it is considered as
      # \`FAILED\` and could be cleaned.
      timeout: Int
    }
  `,
];
