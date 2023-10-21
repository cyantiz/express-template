import {inject, injectable} from 'tsyringe';

import {
  IPermissionRepository,
  PermissionDocument,
} from '../../data/repositories/permissionRepository';
import {Permission} from '../../data/schemas';

import {ValidationFailure, ValidationResult, Validator} from './validator';

export interface IPermissionValidator
  extends Validator<Permission, PermissionDocument, IPermissionRepository> {
  validate(role: Permission): Promise<ValidationResult>;
}

@injectable()
export class PermissionValidator
  extends Validator<Permission, PermissionDocument, IPermissionRepository>
  implements IPermissionValidator {
  constructor(@inject('IPermissionRepository') repository: IPermissionRepository) {
    super(repository);
  }

  public async validate(role: Permission): Promise<ValidationResult> {
    const schemaFailures = await this.validateBySchema(role);

    const failures: ValidationFailure[] = [...schemaFailures];

    return {valid: failures.length === 0, failures};
  }
}
