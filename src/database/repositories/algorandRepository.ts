import Sequelize from 'sequelize';
import { IRepositoryOptions } from './IRepositoryOptions';
import lodash from 'lodash';
import moment from 'moment';

const Op = Sequelize.Op;

export default class AlgorandRepository {
  static async getStats(
    options: IRepositoryOptions,
  ) {
    const {sequelize} = options.database;

    const from = moment().subtract(365, 'days').format('YYYY-MM-DD');
    const to = moment().format('YYYY-MM-DD');

    const daily_stats_statement = `select distinct on (date_trunc('day', "createdDate")) "totalLiquidity", "lastDayVolume", date("createdDate") as "createdDate"` +
      ` from "algoHistory" where date_trunc('day', "createdDate") in ` + 
      `(SELECT (generate_series('${from}', '${to}', '1 day'::interval))::DATE)`;
    const dailyData = await sequelize.query(daily_stats_statement, { type: sequelize.QueryTypes.SELECT });

    const weekly_stats_statement = `select sum("lastDayVolume") as "lastWeekVolume", date(date_trunc('week', "createdDate"::date)) as "week" from "algoHistory" where id in ` +
      `(select distinct on (date_trunc('day', "createdDate")) id from "algoHistory" where date_trunc('day', "createdDate") in ` +
      `(select (generate_series('2020-12-20', '2021-12-23', '1 day'::interval))::date)) group by "week"`;
    const weeklyData = await sequelize.query(weekly_stats_statement, { type: sequelize.QueryTypes.SELECT });

    const top_assets_statement = `select * from "algoAssetHistory" where id in (select distinct on ("assetId") id from "algoAssetHistory" ` +
      `order by "assetId" asc, "createdDate" desc) order by "createdDate", id limit 10`;
    const assets = await sequelize.query(top_assets_statement, { type: sequelize.QueryTypes.SELECT });

    const top_pools_statement = `select * from "algoPoolHistory" where id in (select distinct on ("address") id from "algoPoolHistory" ` +
      `order by "address" asc, "createdDate" desc) order by "createdDate", id limit 10`;
    const pools = await sequelize.query(top_pools_statement, { type: sequelize.QueryTypes.SELECT });

    const topFavorites = [];

    return { dailyData, weeklyData, topFavorites, assets, pools };
  }

  
  static async getAssets(
    options: IRepositoryOptions,
  ) {
    const {sequelize} = options.database;

    const statement = `select * from "algoAssetHistory" where id in (select distinct on ("assetId") id from "algoAssetHistory" ` +
      `order by "assetId" asc, "createdDate" desc) order by "createdDate"`;
    const assets = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });

    return { assets };
  }


  static async getPools(
    options: IRepositoryOptions,
  ) {
    const {sequelize} = options.database;

    const statement = `select * from "algoPoolHistory" where id in (select distinct on ("address") id from "algoPoolHistory" ` +
      `order by "address" asc, "createdDate" desc) order by "createdDate"`;
    const pools = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });

    return { pools };
  }


  // static async getAssetVolumeLiquidity(
  //   options: IRepositoryOptions,
  //   assetId,
  // ) {
  //   const {sequelize} = options.database;

  //   const from = moment().subtract(365, 'days').format('YYYY-MM-DD');
  //   const to = moment().format('YYYY-MM-DD');

  //   const statement = `select distinct on (date_trunc('day', "createdDate")) "liquidity", "lastDayVolume", date("createdDate") as "createdDate" ` + 
  //     `from "algoAssetHistory" where "assetId"='${assetId}' and date_trunc('day', "createdDate") ` +
  //     `in (SELECT (generate_series('${from}', '${to}', '1 day'::interval))::DATE);`
  //   const assets = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });
    
  //   return assets;
  // }


  // static async getAssetHourlyPrice(
  //   options: IRepositoryOptions,
  //   assetId,
  // ) {
  //   const {sequelize} = options.database;

  //   const from = moment().subtract(365, 'days').format('YYYY-MM-DD');
  //   const to = moment().format('YYYY-MM-DD');

  //   const statement = `select date_trunc('hour', "createdDate") as "date", array_agg("price") as price from "algoAssetHistory" ` +
  //     `where "assetId"='${assetId}' group by "date";`
  //   const assets = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });
    
  //   return assets;
  // }


  // static async getAssetDailyPrice(
  //   options: IRepositoryOptions,
  //   assetId,
  // ) {
  //   const {sequelize} = options.database;

  //   const from = moment().subtract(365, 'days').format('YYYY-MM-DD') + ` 08:00:00`;
  //   const to = moment().format('YYYY-MM-DD') + ` 08:00:00`;

  //   const statement = `select date_trunc('hour', "createdDate") as "date", array_agg("price") as "price" from "algoAssetHistory" where ` +
  //     `"assetId"='${assetId}' and date_trunc('hour', "createdDate") in (SELECT (generate_series('${from}', '${to}', '1 day'::interval))) group by "date"`;
    
  //   const assets = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });
    
  //   return assets;
  // }


  static async getAssetDetail(
    options: IRepositoryOptions,
    assetId,
  ) {
    const {sequelize} = options.database;

    const startDate = moment().subtract(365, 'days').format('YYYY-MM-DD');
    const endDate = moment().format('YYYY-MM-DD');

    const startDateTime = moment().subtract(365, 'days').format('YYYY-MM-DD') + ` 08:00:00`;
    const endDateTime = moment().format('YYYY-MM-DD') + ` 08:00:00`;

    const volume_statement = `select distinct on (date_trunc('day', "createdDate")) "liquidity", "lastDayVolume", extract(epoch from date_trunc('day', "createdDate")) as "date" ` + 
      `from "algoAssetHistory" where "assetId"='${assetId}' and date_trunc('day', "createdDate") ` +
      `in (SELECT (generate_series('${startDate}', '${endDate}', '1 day'::interval))::DATE);`
    const dailyAssetData = await sequelize.query(volume_statement, { type: sequelize.QueryTypes.SELECT });

    const daily_statement = `select date_trunc('hour', "createdDate") as "date", array_agg("price") as "prices" from "algoAssetHistory" where ` +
      `"assetId"='${assetId}' and date_trunc('hour', "createdDate") in (SELECT (generate_series('${startDateTime}', '${endDateTime}', '1 day'::interval))) group by "date"`;
    const dailyPricesResult = await sequelize.query(daily_statement, { type: sequelize.QueryTypes.SELECT });
    const dailyPrices = dailyPricesResult.map(asset => {
      const prices = lodash.sortBy(asset.prices);

      if (prices.length === 1) return ({
        'createdDate': asset.date,
        'open': prices[0],
        'close': prices[0],
        'high': prices[0],
        'low': prices[0],
      })
      else if (prices.length === 2) return ({
        'createdDate': asset.date,
        'low': prices[0],
        'open': prices[0],
        'close': prices[1],
        'high': prices[1],
      })
      else if (prices.length === 3) return ({
        'createdDate': asset.date,
        'low': prices[0],
        'open': prices[1],
        'close': prices[1],
        'high': prices[2],
      })
      else return ({
        'createdDate': asset.date,
        'low': prices[0],
        'open': prices[1],
        'close': prices[2],
        'high': prices[3],
      });
    });

    const hourly_statement = `select extract(epoch from date_trunc('hour', "createdDate")) as "date", array_agg("price") as "prices" from "algoAssetHistory" where ` +
      `"assetId"='${assetId}' and date_trunc('day', "createdDate") in (SELECT (generate_series('${startDate}', '${endDate}', '1 day'::interval))) group by "date"`;
    const hourlyPricesResult = await sequelize.query(hourly_statement, { type: sequelize.QueryTypes.SELECT });
    const hourlyPrices = hourlyPricesResult.map(asset => {
      const prices = lodash.sortBy(asset.prices);

      if (prices.length === 1) return ({
        'timestamp': asset.date,
        'open': prices[0],
        'close': prices[0],
        'high': prices[0],
        'low': prices[0],
      })
      else if (prices.length === 2) return ({
        'timestamp': asset.date,
        'low': prices[0],
        'open': prices[0],
        'close': prices[1],
        'high': prices[1],
      })
      else if (prices.length === 3) return ({
        'timestamp': asset.date,
        'low': prices[0],
        'open': prices[1],
        'close': prices[1],
        'high': prices[2],
      })
      else return ({
        'timestamp': asset.date,
        'low': prices[0],
        'open': prices[1],
        'close': prices[2],
        'high': prices[3],
      });
    });

    return { dailyAssetData, dailyPrices, hourlyPrices };
  }
}
