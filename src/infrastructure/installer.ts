import {DependencyContainer} from 'tsyringe';

import S3Storage, {ICloudStorage} from './cloudStorage';
import {IUserMailerSender, UserMailerReceiver} from './mailer';

export function install(container: DependencyContainer) {
  container.register<ICloudStorage>('ICloudStorage', {
    useClass: S3Storage,
  });
  container.register<IUserMailerSender>('IUserMailerSender', {
    useClass: UserMailerReceiver,
  });
}
