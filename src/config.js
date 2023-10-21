/* eslint-disable prettier/prettier */
/* eslint-disable no-undef */
export default {
  connectionString: process.env.MONGO_DB_CONNECTION_STRING,
  serverDomain: process.env.SERVER_DOMAIN,
  frontEndDomain: process.env.FRONT_END_DOMAIN,
  secretKeyResetPassword: 'secret-here',
  jwt: {
    privateKey: 'privateKey',
    issuer: 'issuer',
    audience: 'client',
    tokenLifeTime: '720h',
  },
  timezone: '+07:00',
  mailer: {
    host: 'smtp.gmail.com',
    port: 465,
    user: 'your-mail@gmail.com',
    pass: 'your-pass',
  },
  defaultAvatar: 'default-avatar-url',
}
