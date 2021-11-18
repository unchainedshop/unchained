
LOGGER (DONE)
1. Create new repo unchained:logger
2. Configurable only through process.env
3. No DB attached to logger
4. No log-module available anymore (no Logs.find, etc.)

EVENTS
1. Create new repo unchained:events
2. move EventDirector out of core-events _emit_, _setEmitAdapter, _registerEvents_, _setEmitHistoryAdapter_ (core-events) 
3. Core-events uses db to track events

Async-await 

Architecture

-------------
| Plattform |
-------------

| Core | API | DB | EventEmitter | Logger |

INTETRAGION
1. User Logger and Events in core and api packages