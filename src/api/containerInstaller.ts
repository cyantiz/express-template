import {container} from 'tsyringe';

import * as infrastructureInstaller from '../infrastructure/installer';
import * as dataInstaller from '../data/installer';
import * as serviceInstaller from '../services/installer';

// install dependencies
console.info('Installing dependencies...');
infrastructureInstaller.install(container);

// inject dependencies
dataInstaller.install(container);
serviceInstaller.install(container);

export default container;
