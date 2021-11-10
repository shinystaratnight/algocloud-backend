import SequelizeRepository from '../../database/repositories/sequelizeRepository';
import AuditLogRepository from './auditLogRepository';
import SequelizeFilterUtils from '../../database/utils/sequelizeFilterUtils';
import Sequelize from 'sequelize';
import { IRepositoryOptions } from './IRepositoryOptions';

const Op = Sequelize.Op;

export default class SuperadminRepository {
  static async fetchAllUsers(
    { filter, limit = 0, offset = 0, orderBy = '' },
    options: IRepositoryOptions,
  ) {
    const transaction = SequelizeRepository.getTransaction(
      options,
    );

    let whereAnd: Array<any> = [];
    let include: any = [];

    whereAnd.push({
      ['superadmin']: false,
    });

    if (filter) {
      if (filter.id) {
        whereAnd.push({
          ['id']: filter.id,
        });
      }

      if (filter.fullName) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes(
            'user',
            'fullName',
            filter.fullName,
          ),
        );
      }

      if (filter.email) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes(
            'user',
            'email',
            filter.email,
          ),
        );
      }

      if (filter.active !== null && filter.active !== '') {
        whereAnd.push({
          ['active']: filter.active
        });
      }
    }

    const where = { [Op.and]: whereAnd };

    let {
      rows,
      count,
    } = await options.database.user.findAndCountAll({
      where,
      include,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      order: orderBy
        ? [orderBy.split('_')]
        : [['email', 'ASC']],
      transaction,
    });

    return { rows, count };
  }

  static async updateUserStatus(
    id,
    options: IRepositoryOptions,
  ) {
    const currentUser = SequelizeRepository.getCurrentUser(
      options
    );

    const transaction = SequelizeRepository.getTransaction(
      options
    );

    const user = await options.database.user.findByPk(id, {
      transaction,
    });

    const userStatus = user.active;

    await user.update(
      {
        active: !userStatus,
      },
      { transaction },
    );

    await AuditLogRepository.log(
      {
        entityName: 'user',
        entityId: id,
        action: AuditLogRepository.UPDATE,
        values: {
          id,
          active: !userStatus,
        },
      },
      options,
    );

    return user;
  }

  static async fetchAllTenants(
    { filter, limit = 0, offset = 0, orderBy = '' },
    options: IRepositoryOptions,
  ) {
    const transaction = SequelizeRepository.getTransaction(
      options,
    );

    let whereAnd: Array<any> = [];
    let include: any = [];

    if (filter) {
      if (filter.id) {
        whereAnd.push({
          ['id']: filter.id,
        });
      }

      if (filter.name) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes(
            'tenant',
            'name',
            filter.name,
          ),
        );
      }
    }

    const where = { [Op.and]: whereAnd };

    let {
      rows,
      count,
    } = await options.database.tenant.findAndCountAll({
      where,
      include,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      order: orderBy
        ? [orderBy.split('_')]
        : [['name', 'ASC']],
      transaction,
    });

    return { rows, count };
  }
}
