
LOGGER (DONE)
1. Create new repo unchained:logger
2. Configurable only through process.env
3. No DB attached to logger
4. No log-module available anymore (no Logs.find, etc.)

EVENTS (DONE)
1. Create new repo unchained:events
2. move EventDirector out of core-events _emit_, _setEmitAdapter_, _registerEvents_, _setEmitHistoryAdapter_ (core-events) 
3. Core-events uses db to track events

CORE-EVENTS (DONE)
1. Use _setEmitHistoryAdapter_ to create a default History adapter that writes to the database.

Async-await 

Architecture

-------------
| Plattform |
-------------

| Core | API | DB | EventEmitter | Logger |

INTETRAGION (DONE)
1. User Logger and Events in core and api packages


OPEN QUESTIONS FOR PASCAL
1. Logs in DB incl. any information in the API is removed. Correct?
2. Should the setEmitHistoryAdapter be public and overwriteable? <-- Adapter (Part of module): Lease as is
3. _unchained-logger_ and _unchained-events_ are now (public) npm packages. Shall I revert them to atmosphere packages? Do we have a @unchained namespace for those? @unchained-shop/
 - Versioning? 
4. No changes for now to reduce async-await. I suggest that is something for another day!? 🍀


5. Move events plugins (redis, node). DONE
6. Breaking changes in README
7. Atmosphere