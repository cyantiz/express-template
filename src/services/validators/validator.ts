import {Document} from 'mongoose';

import {IBaseRepository} from '../../data/repositories/baseRepository';

export interface IValidator<TModel> {
  validateBySchema(model: TModel, ...args: any[]): Promise<ValidationFailure[]>;
}

export interface ValidationResult {
  valid: boolean;
  failures?: ValidationFailure[];
}

export interface ValidationFailure {
  reason: string;
  message?: string;
}

export abstract class Validator<
  TModel,
  TDocument extends Document,
  TIRepository extends IBaseRepository<TModel, TDocument>
> implements IValidator<TModel> {
  constructor(protected repository: TIRepository) {}

  public async validateBySchema(item: TModel): Promise<ValidationFailure[]> {
    let failures: ValidationFailure[] = [];
    const schemaError = await this.repository.validateBySchema(item);

    if (schemaError) {
      failures = failures.concat(
        Object.values(schemaError.errors).map((x) => ({
          reason: BaseValidationFailure.SchemaConstraintsViolated,
          message: x.toString(),
        })),
      );
    }

    return failures;
  }
}

enum BaseValidationFailure {
  SchemaConstraintsViolated = 'SchemaConstraintsViolated',
}
