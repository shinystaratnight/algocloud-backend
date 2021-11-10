import SequelizeRepository from '../database/repositories/sequelizeRepository';
import { IServiceOptions } from './IServiceOptions';
import SuperadminRepository from '../database/repositories/superadminRepository';

export default class SuperadminService {
  options: IServiceOptions;
  data;
  transaction;
  user;

  constructor(options) {
    this.options = options;
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
}
