import { LogLevel } from 'unchained-core-types';
import { createLogger } from './createLogger';
import { LocalTransport } from './LocalTransport';
var instance = null;
var Logger = /** @class */ (function () {
    function Logger(Logs) {
        if (!instance) {
            instance = this;
        }
        var dbTransport = !process.env.LOG_DISABLE_DB_LOGGER
            ? [new LocalTransport({ Logs: Logs, level: LogLevel.Info })]
            : [];
        this.winston = createLogger('unchained', dbTransport);
        return this;
    }
    return Logger;
}());
export { Logger };
//# sourceMappingURL=Logger.js.map