import express, { NextFunction, Request, Response } from 'express';
import config from './utils/config';
import { healthCheckRequestHandler } from './utils/healthcheck';

export async function createApp() {
  const app = express();

  // This endpoints is used by docker (or any monitoring tool)
  // to know if the service is healthy
  app.get('/health', healthCheckRequestHandler);

  app.use((error: Error, request: Request, response: Response, next: NextFunction) => {
    console.error(error.stack);
    response.setHeader('Content-Type', 'application/json');

    let responseMessage: any = { error: true, message: 'Something bad happens on our side. Sorry.' };
    responseMessage['errorDetails'] = error;

    response.status(500).send(JSON.stringify(responseMessage || {}, null, 2));
  });

  return app;
}
