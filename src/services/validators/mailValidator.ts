import {inject, injectable} from 'tsyringe';

import {User} from '../../data/schemas';
import {IUserRepository, UserDocument} from '../../data/repositories/userRepository';

import {ValidationResult, Validator} from './validator';

export interface IMailValidator extends Validator<User, UserDocument, IUserRepository> {
  validate(emails: string[]): Promise<ValidationResult>;
}

@injectable()
export class MailValidator
  extends Validator<User, UserDocument, IUserRepository>
  implements IMailValidator {
  constructor(@inject('IUserRepository') repository: IUserRepository) {
    super(repository);
  }

  public async validate(emails: string[]): Promise<ValidationResult> {
    // TODO : implement this method

    console.log('validate email', emails);

    return {valid: true};
  }
}
