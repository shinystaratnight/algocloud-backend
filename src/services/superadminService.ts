import SequelizeRepository from '../database/repositories/sequelizeRepository';
import { IServiceOptions } from './IServiceOptions';
import SuperadminRepository from '../database/repositories/superadminRepository';
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

  async createTenant(data) {
    const { email, name } = data;

    const transaction = await SequelizeRepository.createTransaction(
      this.options.database,
    );

    try {
      if (getConfig().TENANT_MODE === 'single') {
        throw new Error400(
          this.options.language,
          'tenant.exists',
        );
      }

      const user = await SuperadminRepository.createUser(email, {
        ...this.options,
        transaction,
      });

      const tenant = await SuperadminRepository.createTenant({ name }, {
        ...this.options,
        transaction,
      });

      // await SettingsService.findOrCreateDefault({
      //   ...this.options,
      //   currentTenant: tenant,
      //   transaction,
      // });

      const tenantUser = await SuperadminRepository.createTenantUser(
        tenant,
        user,
        [Roles.values.admin],
        {
          ...this.options,
          transaction,
        },
      );

      const link = `${tenantSubdomain.frontendUrl(
        this.options.currentTenant,
      )}/auth/invitation?token=${tenantUser.invitationToken}`;

      new EmailSender(
        EmailSender.TEMPLATES.INVITATION,
        {
          tenant: tenant,
          link,
        },
      ).sendTo(email);

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

  async destroyTenants(ids) {
    const transaction = await SequelizeRepository.createTransaction(
      this.options.database,
    );

    try {
      for (const id of ids) {
        const tenant = await SuperadminRepository.findTenantById(id, {
          ...this.options,
          transaction,
        });

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

        await SuperadminRepository.destroyTenantById(id, {
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
