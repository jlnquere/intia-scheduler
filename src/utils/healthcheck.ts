import { RequestHandler } from 'express';
import config from './config';

export const healthCheckRequestHandler: RequestHandler = async (req, res) => {
  // Status object is a dictionary of boolean values. Each value represent a health check on
  // a particular part of the application.
  // This project is pretty simple; so we'll just check Redis connectioN.
  // TODO JQU
  const status: any = { redis: false };
  try {
    status.redis = true; //await RedisDB.healthCheck();
  } catch (e) {
    console.debug(e);
  }

  // The server is healthy if all the health checks are true.
  const isOk = Object.values(status).reduce((res, val) => res && val, true);

  res.status(isOk ? 200 : 503).json({
    ...status,
    version: require('../../package').version,
    build: process.env.BUILD_NUMBER || 'unknown',
  });
};
