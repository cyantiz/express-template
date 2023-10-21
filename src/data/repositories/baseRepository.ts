import {Document, Model, Error, Types, ClientSession} from 'mongoose';

import {DbContext} from '../dbContext';
import {Transaction} from '../transaction';

export interface BulkWriteResult {
  matchedCount?: number;
  insertedCount?: number;
  modifiedCount?: number;
  deletedCount?: number;
}

interface WithId {
  _id: Types.ObjectId;
}

export interface IBaseRepository<
  TModel,
  TDocument extends Document,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TDocumentModel extends Model<TDocument> = Model<TDocument>
> {
  get(): Promise<TModel[]>;
  getIn(ids: string[]): Promise<TModel[]>;
  getById(id: string): Promise<TModel>;
  create(item: TModel, options?: {transaction?: Transaction}): Promise<TModel>;
  createMany(items: TModel[], options?: {transaction?: Transaction}): Promise<TDocument[]>;
  update(
    id: string,
    item: TModel | Record<string, unknown>,
    options?: {transaction?: Transaction},
  ): Promise<TModel>;
  updateMany(
    models: (TModel & WithId)[] | Partial<TModel & WithId>[],
    options?: {transaction?: Transaction},
  ): Promise<BulkWriteResult>;
  delete(id: string, options?: {transaction?: Transaction}): Promise<TModel>;
  deleteMany(ids: string[], options?: {transaction?: Transaction}): Promise<TModel[]>;
  validateBySchema(model: TModel): Promise<Error.ValidationError>;
}

export abstract class BaseRepository<
  TModel,
  TDocument extends Document,
  TDocumentModel extends Model<TDocument> = Model<TDocument>
> implements IBaseRepository<TModel, TDocument, TDocumentModel> {
  constructor(protected context: DbContext) {}

  protected abstract get model(): TDocumentModel;

  public async get(): Promise<TModel[]> {
    return await this.model.find().lean().exec();
  }

  public async getIn(ids: string[]): Promise<TModel[]> {
    return await this.model
      .find({_id: {$in: ids}})
      .lean()
      .exec();
  }

  public async getById(id: string): Promise<TModel> {
    return await this.model.findById(id).lean().exec();
  }

  public async create(item: TModel, options?: {transaction?: Transaction}): Promise<TModel> {
    const session = options && options.transaction && options.transaction.session;
    const collectionExists = await this.context.collectionExists(this.model.collection.name);

    if (!collectionExists) {
      await this.model.createCollection();
    }

    const documents = await this.model.create([item as TModel], {session} as {
      session?: ClientSession;
    });

    return {
      ...item,
      _id: documents[0].id,
      createdAt: (documents[0] as any).createdAt,
    };
  }

  public async createMany(
    items: TModel[],
    options?: {transaction?: Transaction},
  ): Promise<TDocument[]> {
    if (items.length === 0) {
      return [];
    }

    const session = options && options.transaction && options.transaction.session;
    const collectionExists = await this.context.collectionExists(this.model.collection.name);

    if (!collectionExists) {
      await this.model.createCollection();
    }

    const documents = await this.model.insertMany(items, {session});

    return documents;
  }

  public async update(
    id: string,
    item: TModel | Record<string, unknown>,
    options?: {transaction?: Transaction},
  ): Promise<TModel> {
    const session = options && options.transaction && options.transaction.session;

    return await this.model.findOneAndUpdate({_id: id}, item, {session, new: true}).lean().exec();
  }

  public async updateMany(
    models: (TModel & WithId)[] | Partial<TModel & WithId>[],
    options?: {transaction?: Transaction},
  ): Promise<BulkWriteResult> {
    const session = options && options.transaction && options.transaction.session;
    const operations = [];

    for (const model of models) {
      operations.push({
        updateOne: {
          filter: {_id: model._id},
          update: model,
        },
      });
    }

    if (operations.length === 0) {
      return {
        matchedCount: 0,
        modifiedCount: 0,
      };
    }

    const result = await this.model.bulkWrite(operations, {session});

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  public async delete(id: string, options?: {transaction?: Transaction}): Promise<TModel> {
    const session = options && options.transaction && options.transaction.session;

    return await this.model.findOneAndDelete({_id: id}, {session}).lean().exec();
  }

  public async deleteMany(ids: string[], options?: {transaction?: Transaction}): Promise<TModel[]> {
    const session = options && options.transaction && options.transaction.session;

    return await this.model
      .deleteMany({_id: {$in: ids}})
      .session(session)
      .lean()
      .exec();
  }

  public async validateBySchema(model: TModel): Promise<Error.ValidationError | null> {
    return new Promise((resolve) => {
      const instance = new this.model(model);

      instance.validate((err) => {
        if (err) {
          resolve(err as Error.ValidationError);
        } else {
          resolve(null);
        }
      });
    });
  }
}
