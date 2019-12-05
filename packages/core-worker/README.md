# Worker (Unchained Engine)

This is a simple implementation of a worker queue and workers as plugins.

Plugins are linked to jobs by the `type`.

Requirements:

- [ ] Notification if jobs fail (Email)
- [x] Max retries: Parent
- [x] Copy failed job
- [ ] Ensure payload is JSON
- [ ] Cleanup (Recurring):
  - Are there any started jobs, where no progress is made (worker crashed) -> Generate summary mail
  - Jobs that should be retried, but arent
- [x] Use littledata:synced-cron
- [x] Identify worker
- [x] External worker plugin (throws on DoWork)
- [x] Do not allow workerId for addWork (Weird side-effects)

## Explanations

- It is the plugins responsibility to handle the retries.
