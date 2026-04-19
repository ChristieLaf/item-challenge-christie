import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

export const logInfo = (handler: string, message: string, meta?: any) => {
  logger.info({ handler, message, ...(meta && { meta }) });
};

export const logError = (handler: string, error: any, meta?: any) => {
  logger.error({
    handler,
    message: error.message,
    stack: error.stack,
    ...(meta && { meta }),
  });
};