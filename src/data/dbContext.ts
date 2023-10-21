import mongoose, {Connection, Document, Model, ClientSession, Collection} from 'mongoose';
import {v4 as uuid} from 'uuid';
import {typedModel} from 'ts-mongoose';

import config from '../config';

import {ConnectionHooks} from './connectionHooks';
import {modelDefs} from './schemas';

interface ClientSessionContainer {
  id: string;
  session: ClientSession;
}

export class DbContext {
  private connection: Connection;

  private sessions: Map<string, ClientSession> = new Map();

  private collections: Map<string, Collection> = new Map();

  public async connect(hooks?: ConnectionHooks) {
    this.connection = await this.createConnection(hooks || {});
    const models = modelDefs();

    for (const model of models) {
      typedModel(model.name, model.schema);
    }

    return this;
  }

  private async createConnection(hooks: ConnectionHooks): Promise<Connection> {
    const connection = mongoose.connection;

    connection.on('connecting', () => {
      if (hooks.onConnecting) {
        hooks.onConnecting();
      }
    });

    connection.on('connected', () => {
      console.log('Mongoose connected');
      if (hooks.onConnected) {
        hooks.onConnected();
      }
    });

    connection.once('open', () => {
      if (hooks.onOpen) {
        hooks.onOpen();
      }
    });

    connection.on('disconnecting', () => {
      if (hooks.onDisconnecting) {
        hooks.onDisconnecting();
      }
    });

    connection.on('disconnected', () => {
      if (hooks.onDisconnected) {
        hooks.onDisconnected();
      }
    });

    connection.on('close', () => {
      if (hooks.onClose) {
        hooks.onClose();
      }
    });

    connection.on('reconnected', () => {
      if (hooks.onReconnected) {
        hooks.onReconnected();
      }
    });

    connection.on('error', (error) => {
      console.log('Mongoose error', error);
      if (hooks.onError) {
        hooks.onError(error);
      }
    });

    mongoose.connect(config.connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ignoreUndefined: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });

    return connection;
  }

  public model<T extends Document>(name: string): Model<T> {
    return this.connection.model(name);
  }

  public async collectionExists(name: string): Promise<boolean> {
    if (this.collections.has(name)) {
      return true;
    }

    const collections = await this.connection.db.listCollections({name}).toArray();

    if (collections && collections.length > 0) {
      this.collections.set(name, collections[0]);

      return true;
    }

    return false;
  }

  public async startTransaction(): Promise<ClientSessionContainer> {
    const session = await this.connection.startSession({
      defaultTransactionOptions: {
        readConcern: {level: 'snapshot'},
        writeConcern: {w: 1},
      },
    });

    session.startTransaction();

    const id = uuid();

    this.sessions.set(id, session);

    return {id, session};
  }

  public async commitTransaction(id: string): Promise<void> {
    if (!this.sessions.has(id)) {
      return;
    }

    await this.sessions.get(id).commitTransaction();
  }

  public async rollbackTransaction(id: string): Promise<void> {
    if (!this.sessions.has(id)) {
      return;
    }

    await this.sessions.get(id).abortTransaction();
  }

  public disposeTransaction(id: string): Promise<void> {
    if (!this.sessions.has(id)) {
      return;
    }

    this.sessions.get(id).endSession();
    this.sessions.delete(id);
  }
}
