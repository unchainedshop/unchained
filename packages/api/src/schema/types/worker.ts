export default [
  /* GraphQL */ `
    enum WorkStatus {
      NEW
      ALLOCATED
      SUCCESS
      FAILED
      DELETED
    }

    # This is just a placeholder. Extend WorkType with the active plugins on
    # startup. See /examples/kitchensink/boot.js:92
    enum WorkType {
      UNKNOWN
    }

    type WorkOutput {
      result: JSON
      error: JSON
      success: Boolean!
    }

    type Work {
      _id: ID!
      # Timestamp when this work was allocated -> Locked for other workers
      started: DateTime
      finished: DateTime
      created: DateTime!
      updated: DateTime
      deleted: DateTime

      priority: Int!
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
      scheduled: DateTime

      # Link to original work: For retries, clones, ...
      original: Work

      # How many times this work should be retried. A retried work is a clone
      # with \`retries = parent.retries - 1\` usually. Plugins can implement
      # different workflows.
      retries: Int!

      # If work is \`ALLOCATED\` longer than \`timeout\` it is considered as
      # \`FAILED\` and could be cleaned.
      timeout: Int

      # If true, the work item was scheduled by the autoscheduling system
      autoscheduled: Boolean
    }
  `,
];
