import {autoInjectable} from 'tsyringe';
import {ClientSession} from 'mongodb';

import {DbContext} from './dbContext';

@autoInjectable()
export class Transaction {
  private id: string;

  private _session: ClientSession;

  constructor(private context?: DbContext) {}

  public get session(): ClientSession {
    return this._session;
  }

  public static async begin<T = any>(todo: (t: Transaction) => Promise<T>) {
    const transaction = new Transaction();
    const sessionContainer = await transaction.context.startTransaction();

    transaction.id = sessionContainer.id;
    // eslint-disable-next-line no-underscore-dangle
    transaction._session = sessionContainer.session;
    const result = await todo(transaction);

    transaction.context.disposeTransaction(transaction.id);

    return result;
  }

  public async commit(): Promise<void> {
    await this.context.commitTransaction(this.id);
  }

  public async rollback(): Promise<void> {
    await this.context.rollbackTransaction(this.id);
  }
}
