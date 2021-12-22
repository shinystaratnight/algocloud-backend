import SequelizeRepository from '../database/repositories/sequelizeRepository';
import { IServiceOptions } from './IServiceOptions';
import AlgorandRepository from '../database/repositories/algorandRepository';
import PermissionChecker from './user/permissionChecker';
import Permissions from '../security/permissions';
import TenantRepository from '../database/repositories/tenantRepository';
import Plans from '../security/plans';
import Error400 from '../errors/Error400';
import SettingsService from './settingsService';
import TenantUserRepository from '../database/repositories/tenantUserRepository';
import Roles from '../security/roles';
import { getConfig } from '../config';
import EmailSender from './emailSender';
import { tenantSubdomain } from './tenantSubdomain';

export default class AlgorandService {
  options: IServiceOptions;
  data;
  transaction;
  user;

  constructor(options) {
    this.options = options;
  }

  async getStats() {
    return AlgorandRepository.getStats(
      this.options,
    );
  }

  async getPools(args) {
    return AlgorandRepository.getPools(
      args,
      this.options,
    );
  }

  async getAssets(args) {
    return AlgorandRepository.getAssets(
      args,
      this.options,
    );
  }
}
