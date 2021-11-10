import SequelizeRepository from '../database/repositories/sequelizeRepository';
import { IServiceOptions } from './IServiceOptions';
import SuperadminRepository from '../database/repositories/superadminRepository';
import PermissionChecker from './user/permissionChecker';
import Permissions from '../security/permissions';
import TenantRepository from '../database/repositories/tenantRepository';
import Plans from '../security/plans';
import Error400 from '../errors/Error400';

export default class SuperadminService {
  options: IServiceOptions;
  data;
  transaction;
  user;

  constructor(options) {
    this.options = options;
  }

  async fetchAllUsers(args) {
    return SuperadminRepository.fetchAllUsers(
      args,
      this.options,
    );
  }

  async updateUser(id) {
    try {
      this.transaction = await SequelizeRepository.createTransaction(
        this.options.database,
      );

      await SuperadminRepository.updateUserStatus(id, this.options);

      await SequelizeRepository.commitTransaction(
        this.transaction
      );

    } catch (error) {
      await SequelizeRepository.rollbackTransaction(
        this.transaction
      );

      throw error;
    }
  }

  async fetchAllTenants(args) {
    return SuperadminRepository.fetchAllTenants(
      args,
      this.options,
    );
  }

  async destroyTenants(ids) {
    const transaction = await SequelizeRepository.createTransaction(
      this.options.database,
    );

    try {
      for (const id of ids) {
        const tenant = await TenantRepository.findById(id, {
          ...this.options,
          transaction,
          currentTenant: { id },
        });

        new PermissionChecker({
          ...this.options,
          currentTenant: tenant,
        }).validateHas(Permissions.values.tenantDestroyBySuperadmin);

        if (
          !Plans.allowTenantDestroy(
            tenant.plan,
            tenant.planStatus,
          )
        ) {
          throw new Error400(
            this.options.language,
            'tenant.planActive',
          );
        }

        await TenantRepository.destroy(id, {
          ...this.options,
          transaction,
          currentTenant: { id },
        });
      }

      await SequelizeRepository.commitTransaction(
        transaction,
      );
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(
        transaction,
      );
      throw error;
    }
  }
}
