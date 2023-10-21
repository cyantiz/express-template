import nodemailer from 'nodemailer';
import _ from 'lodash';

import config from '../../config';

export class Mailer {
  private smtpTransport;

  constructor() {
    this.smtpTransport = nodemailer.createTransport({
      host: config.mailer.host,
      port: config.mailer.port,
      secure: true,
      auth: {
        user: config.mailer.user,
        pass: config.mailer.pass,
      },
      logger: true,
    });
  }

  public async send(
    recipient: string[],
    subject: string,
    body: string,
    copyCarbon?: string[],
  ): Promise<void> {
    const hrMail = config.adminMail.humanResources;
    const mailOptions = {
      to: recipient,
      from: config.mailer.user,
      cc: copyCarbon ? _.uniq([...copyCarbon, hrMail]) : [hrMail],
      subject,
      html: body,
    };

    await this.smtpTransport.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log('__ERROR__:', err);
      } else {
        console.log('Message was sent!', info);
      }
    });
  }
}
