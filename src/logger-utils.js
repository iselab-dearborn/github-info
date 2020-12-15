const { createLogger, format, transports } = require('winston');

class LoggerUtils {

    constructor() {

        this.logger = createLogger({
            format: format.combine(
                format.colorize(),
                format.splat(),
                format.simple(),
                format.timestamp(),
                format.align()
            ),
            transports: [
                new transports.Console()
            ]
        });
    }

    info(message, ...parameters) {
        this.logger.log('info', message, ...parameters);
    }

    debug(message, ...parameters) {
        this.logger.log('debug', message, ...parameters);
    }

    error(message, ...parameters) {
        this.logger.log('error', message, ...parameters);
    }
}

const logger = new LoggerUtils();

module.exports = logger;
