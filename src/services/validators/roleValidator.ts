import {inject, injectable} from 'tsyringe';

import {IRoleRepository, RoleDocument} from '../../data/repositories/roleRepository';
import {Role} from '../../data/schemas';

import {ValidationFailure, ValidationResult, Validator} from './validator';

export interface IRoleValidator extends Validator<Role, RoleDocument, IRoleRepository> {
  validate(role: Role): Promise<ValidationResult>;
}

@injectable()
export class RoleValidator
  extends Validator<Role, RoleDocument, IRoleRepository>
  implements IRoleValidator {
  constructor(@inject('IRoleRepository') repository: IRoleRepository) {
    super(repository);
  }

  public async validate(role: Role): Promise<ValidationResult> {
    const schemaFailures = await this.validateBySchema(role);

    const failures: ValidationFailure[] = [...schemaFailures];

    return {valid: failures.length === 0, failures};
  }
}
