import * as server from '../server';

import app, {connectToDb, scheduleAppJobs} from './installer';

connectToDb()
  .then(() => {
    scheduleAppJobs();
  })
  .catch((err) => console.error(err));
console.info('Staring the server...');
server.start(app, 5001);
