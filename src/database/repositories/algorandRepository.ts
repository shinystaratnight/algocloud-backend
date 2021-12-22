import Sequelize from 'sequelize';
import SequelizeRepository from '../../database/repositories/sequelizeRepository';
import AuditLogRepository from './auditLogRepository';
import SequelizeFilterUtils from '../../database/utils/sequelizeFilterUtils';
import { IRepositoryOptions } from './IRepositoryOptions';
import Error404 from '../../errors/Error404';
import { v4 as uuid } from 'uuid';
import lodash from 'lodash';
import Error400 from '../../errors/Error400';
import UserRepository from './userRepository';
import crypto from 'crypto';
import Error401 from '../../errors/Error401';
import { getConfig } from '../../config';
import _get from 'lodash/get';
import moment from 'moment';

const Op = Sequelize.Op;

export default class AlgorandRepository {
  static async getStats(
    options: IRepositoryOptions,
  ) {
    const {sequelize} = options.database;

    const from = moment(moment().startOf('week').toDate()).format('YYYY-MM-DD');
    var to = moment(moment().endOf('week').toDate()).format('YYYY-MM-DD');
    const statement = `select distinct on (date_trunc('day', "createdDate")) id, "totalLiquidity", "lastDayVolume", date("createdDate") as "createdDate"` +
      ` from "algoHistory" where date_trunc('day', "createdDate") in ` + 
      `(SELECT (generate_series('${from}', '${to}', '1 day'::interval))::DATE)`;
    const history = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });
    return history;
  }

  
  static async getAssets(
    { filter, limit = 0, offset = 0, orderBy = '' },
    options: IRepositoryOptions,
  ) {
    
  }


  static async getPools(
    { filter, limit = 0, offset = 0, orderBy = '' },
    options: IRepositoryOptions,
  ) {
    
  }

}
