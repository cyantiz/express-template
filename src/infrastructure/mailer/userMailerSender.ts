/* eslint-disable @typescript-eslint/no-var-requires */
import config from '../../config';

import {Mailer} from './mailer';

export interface IUserMailerSender {
  receiveOnResetPassword(email: string, token: string): Promise<void>;
}
export class UserMailerReceiver extends Mailer implements IUserMailerSender {
  public async receiveOnResetPassword(email: string, token: string): Promise<void> {
    const host = config.frontEndDomain;
    const subject = 'Password Reset';
    const template = null; // TODO : add pug template

    const body = template({
      resetUrl: `${host}/auth/recovery/${token}`,
    });

    await this.send([email], subject, body);
  }
}
