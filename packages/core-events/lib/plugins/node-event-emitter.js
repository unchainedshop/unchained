import { EventEmitter } from 'events';
var NodeEventEmitter = function () {
    var eventEmitter = new EventEmitter();
    return {
        publish: function (eventName, payload) {
            eventEmitter.emit(eventName, payload);
        },
        subscribe: function (eventName, callback) {
            return eventEmitter.on(eventName, callback);
        }
    };
};
export var nodeAdapater = NodeEventEmitter();
// EventDirector.setEventAdapter(handler);
//# sourceMappingURL=node-event-emitter.js.map