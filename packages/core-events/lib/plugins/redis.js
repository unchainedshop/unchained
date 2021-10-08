import redis from 'redis';
var _a = process.env, _b = _a.REDIS_PORT, REDIS_PORT = _b === void 0 ? 6379 : _b, _c = _a.REDIS_HOST, REDIS_HOST = _c === void 0 ? '127.0.0.1' : _c;
var subscribedEvents = new Set();
var RedisEventEmitter = function () {
    var redisPublisher = redis.createClient({
        port: REDIS_PORT,
        host: REDIS_HOST
    });
    var redisSubscriber = redis.createClient({
        port: REDIS_PORT,
        host: REDIS_HOST
    });
    return {
        publish: function (eventName, payload) {
            return redisPublisher.publish(eventName, JSON.stringify(payload));
        },
        subscribe: function (eventName, callback) {
            redisSubscriber.on('message', function (_channelName, payload) {
                return callback(payload);
            });
            if (!subscribedEvents.has(eventName)) {
                redisSubscriber.subscribe(eventName);
                subscribedEvents.add(eventName);
            }
        }
    };
};
export var redisAdapter = RedisEventEmitter();
// EventDirector.setEventAdapter(handler);
//# sourceMappingURL=redis.js.map