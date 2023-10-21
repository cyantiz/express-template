import * as dotenv from 'dotenv';
dotenv.config();
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';

import {DbContext} from '../data/dbContext';

import container from './containerInstaller';
import authRouter from './routes/authRoute';
import userRouter from './routes/userRoute';
import fileRouter from './routes/fileRoute';
import roleRouter from './routes/roleRoute';
import permissionRouter from './routes/permissionRoute';
import isAuth from './middlewares/isAuth';
import withCurrentUser from './middlewares/withCurrentUser';
import {interceptResponse} from './middlewares/interceptResponse';
import {IRequest, IResponse} from './types';
import {ServerErrorResult} from './httpResponses';

const app = express();

app.use(cors());
app.use(
  express.json({
    limit: '1mb',
  }),
);
app.use(express.urlencoded({extended: false}));

app.use(express.static('public'));

app.use(function (req, res, next) {
  console.info('REQUEST', req.method, req.url, req.body);
  next();
});

app.use(interceptResponse);

app.use('/api/auth', authRouter);
app.use(isAuth);
app.use(withCurrentUser);
app.use('/api/users', userRouter);
app.use('/api/files', fileRouter);
app.use('/api/roles', roleRouter);
app.use('/api/permissions', permissionRouter);

app.use((err, req: IRequest, res: IResponse, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.send({
      statusCode: 401,
      message: 'invalid token',
    });
  }

  console.error(err);
  if (res.headersSent) {
    next(err);
  }

  return res.send(
    ServerErrorResult({
      reason: 'ServerError',
      message: 'Server Error',
    }),
  );
});
export async function connectToDb(): Promise<void> {
  console.info('Connecting to Mongo server...');
  const context = container.resolve(DbContext);

  await context.connect({
    onConnected: () => {
      console.info('Mongo connected');
    },
    onError: (err) => {
      console.error('Error connecting to MongoDB', err);
      process.exit(1);
    },
  });
}
export const scheduleAppJobs = async () => {
  // cron jobs
};

export default app;
