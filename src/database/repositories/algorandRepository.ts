import Sequelize from 'sequelize';
import { IRepositoryOptions } from './IRepositoryOptions';
import _ from 'lodash';
import moment from 'moment';


const makeOHLC = (arr) => {
  const sortedArr = _.sortBy(arr);
  if (sortedArr.length === 1) return ({
    'open': sortedArr[0],
    'close': sortedArr[0],
    'high': sortedArr[0],
    'low': sortedArr[0],
  })
  else if (sortedArr.length === 2) return ({
    'low': sortedArr[0],
    'open': sortedArr[0],
    'close': sortedArr[1],
    'high': sortedArr[1],
  })
  else if (sortedArr.length === 3) return ({
    'low': sortedArr[0],
    'open': sortedArr[1],
    'close': sortedArr[1],
    'high': sortedArr[2],
  })
  else return ({
    'low': sortedArr[0],
    'open': sortedArr[1],
    'close': sortedArr[2],
    'high': sortedArr[3],
  });
};


const makePairRates = (arr) => {
  let oneReserves: number[] = [];
  let twoReserves: number[] = [];

  _.forEach(arr, pair => {
    const [oneReserve, twoReserve] = [..._(_.split(pair, ','))];
    if (oneReserve === null || twoReserve === null || +oneReserve === 0 || +twoReserve === 0) {
      oneReserves.push(0.0);
      twoReserves.push(0.0);
    }
    else {
      oneReserves.push(twoReserve/oneReserve);
      twoReserves.push(oneReserve/twoReserve);
    }
  });

  return [makeOHLC(oneReserves), makeOHLC(twoReserves)];
}


export default class AlgorandRepository {

  static async getStats(
    options: IRepositoryOptions,
  ) {
    const {sequelize} = options.database;

    const from = moment().subtract(365, 'days').format('YYYY-MM-DD');
    const to = moment().format('YYYY-MM-DD');

    const daily_stats_statement = `select distinct on (date_trunc('day', "createdDate")) "totalLiquidity", "lastDayVolume", ` +
      `date("createdDate") as "createdDate" from "algoHistory" where date_trunc('day', "createdDate") in ` + 
      `(SELECT (generate_series('${from}', '${to}', '1 day'::interval))::DATE)`;
    const dailyData = await sequelize.query(daily_stats_statement, { type: sequelize.QueryTypes.SELECT });

    const weekly_stats_statement = `select sum("lastDayVolume") as "lastWeekVolume", date(date_trunc('week', "createdDate"::date)) as "week" ` +
      `from "algoHistory" where id in (select distinct on (date_trunc('day', "createdDate")) id from "algoHistory" ` +
      `where date_trunc('day', "createdDate") in (select (generate_series('${from}', '${to}', '1 day'::interval))::date)) group by "week"`;
    const weeklyData = await sequelize.query(weekly_stats_statement, { type: sequelize.QueryTypes.SELECT });

    const top_assets_statement = `select * from "algoAssetHistory" where id >= (select id from "algoAssetHistory" where "unitName"='ALGO' ` + `
      order by "createdDate" desc limit 1) limit 10;`;
    const topAssets = await sequelize.query(top_assets_statement, { type: sequelize.QueryTypes.SELECT });

    const top_pools_statement = `select * from "algoPoolHistory" where id >= (select id from "algoPoolHistory" where ` +
      `"assetOneUnitName"='USDC' and "assetTwoUnitName"='ALGO' order by "createdDate" desc limit 1) limit 10;`;
    const topPools = await sequelize.query(top_pools_statement, { type: sequelize.QueryTypes.SELECT });

    const topFavorites = [];

    return { dailyData, weeklyData, topFavorites, topAssets, topPools };
  }

  
  static async getAssets(
    options: IRepositoryOptions,
  ) {
    const {sequelize} = options.database;

    const statement = `select * from "algoAssetHistory" where id >= (select id from "algoAssetHistory" where "unitName"='ALGO' ` + `
      order by "createdDate" desc limit 1)`;
    const assets = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });

    return { assets };
  }


  static async getPools(
    options: IRepositoryOptions,
  ) {
    const {sequelize} = options.database;

    const statement = `select * from "algoPoolHistory" where id >= (select id from "algoPoolHistory" where ` +
      `"assetOneUnitName"='USDC' and "assetTwoUnitName"='ALGO' order by "createdDate" desc limit 1)`;
    const pools = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });

    return { pools };
  }


  static async getAssetDetail(
    options: IRepositoryOptions,
    assetId,
  ) {
    const {sequelize} = options.database;

    const startDate = moment().subtract(365, 'days').format('YYYY-MM-DD');
    const endDate = moment().format('YYYY-MM-DD');

    const startDateTime = moment().subtract(365, 'days').format('YYYY-MM-DD') + ` 08:00:00`;
    const endDateTime = moment().format('YYYY-MM-DD') + ` 08:00:00`;

    const volume_statement = `select distinct on (date_trunc('day', "createdDate")) "liquidity", "lastDayVolume", ` +
      `extract(epoch from date_trunc('day', "createdDate")) as "date" ` + 
      `from "algoAssetHistory" where "assetId"='${assetId}' and date_trunc('day', "createdDate") ` +
      `in (SELECT (generate_series('${startDate}', '${endDate}', '1 day'::interval))::DATE);`
    const dailyAssetData = await sequelize.query(volume_statement, { type: sequelize.QueryTypes.SELECT });

    const daily_statement = `select date_trunc('hour', "createdDate") as "date", array_agg("price") as "prices" ` +
      `from "algoAssetHistory" where "assetId"='${assetId}' and date_trunc('hour', "createdDate") ` +
      `in (SELECT (generate_series('${startDateTime}', '${endDateTime}', '1 day'::interval))) group by "date"`;
    const dailyPricesResult = await sequelize.query(daily_statement, { type: sequelize.QueryTypes.SELECT });
    const dailyPrices = dailyPricesResult.map(asset => {
      const { open, high, low, close } = makeOHLC(asset.prices);
      return ({
        'timestamp': asset.date,
        open,
        high,
        low,
        close,
      });
    });

    const hourly_statement = `select extract(epoch from date_trunc('hour', "createdDate")) as "date", array_agg("price") as "prices" ` +
      `from "algoAssetHistory" where "assetId"='${assetId}' and date_trunc('day', "createdDate") ` +
      `in (SELECT (generate_series('${startDate}', '${endDate}', '1 day'::interval))) group by "date"`;
    const hourlyPricesResult = await sequelize.query(hourly_statement, { type: sequelize.QueryTypes.SELECT });
    const hourlyPrices = hourlyPricesResult.map(asset => {
      const { open, high, low, close } = makeOHLC(asset.prices);
      return ({
        'timestamp': asset.date,
        open,
        high,
        low,
        close,
      });
    });

    const pools_statement = `select * from "algoPoolHistory" where id >= (select id from "algoPoolHistory" where` +
      `"assetOneUnitName"='USDC' and "assetTwoUnitName"='ALGO' order by "createdDate" desc limit 1) and ` +
      `("assetOneId" = '${assetId}' or "assetTwoId"='${assetId}') limit 10`;
    const topPools = await sequelize.query(pools_statement, { type: sequelize.QueryTypes.SELECT });

    return { dailyAssetData, dailyPrices, hourlyPrices, topPools };
  }


  static async getPoolDetail(
    options: IRepositoryOptions,
    address,
  ) {
    const {sequelize} = options.database;

    const startDate = moment().subtract(365, 'days').format('YYYY-MM-DD');
    const endDate = moment().format('YYYY-MM-DD');

    const startDateTime = moment().subtract(365, 'days').format('YYYY-MM-DD') + ` 08:00:00`;
    const endDateTime = moment().format('YYYY-MM-DD') + ` 08:00:00`;

    const volume_statement = `select distinct on (date_trunc('day', "createdDate")) "liquidity", "lastDayVolume", ` +
      `extract(epoch from date_trunc('day', "createdDate")) as "date" ` + 
      `from "algoPoolHistory" where "address"='${address}' and date_trunc('day', "createdDate") ` +
      `in (SELECT (generate_series('${startDate}', '${endDate}', '1 day'::interval))::date);`
    const dailyPoolData = await sequelize.query(volume_statement, { type: sequelize.QueryTypes.SELECT });

    const daily_statement = `select extract(epoch from date_trunc('hour', "createdDate")) as "date", ` +
      `array_agg(("assetOneReserves", "assetTwoReserves")) as "reservePairs" ` +
      `from "algoPoolHistory" where "address"='${address}' and date_trunc('hour', "createdDate") ` +
      `in (SELECT (generate_series('${startDateTime}', '${endDateTime}', '1 day'::interval))) group by "date"`;
    const dailyRatesResult = await sequelize.query(daily_statement, { type: sequelize.QueryTypes.SELECT });

    let dailyOneRates: any[] = [];
    let dailyTwoRates: any[] = [];
    dailyRatesResult.map(pool => {
      const [oneReserves, twoReserves] = makePairRates(pool.reservePairs);
      dailyOneRates.push({
        'timestamp': pool.date,
        ...oneReserves
      });
      dailyTwoRates.push({
        'timestamp': pool.date,
        ...twoReserves
      });
    });

    const hourly_statement = `select extract(epoch from date_trunc('hour', "createdDate")) as "date", ` +
      `array_agg("assetOneReserves" || ',' || "assetTwoReserves") as "reservePairs" ` +
      `from "algoPoolHistory" where "address"='${address}' and date_trunc('day', "createdDate") ` +
      `in (SELECT (generate_series('${startDate}', '${endDate}', '1 day'::interval))) group by "date"`;
    const hourlyRatesResult = await sequelize.query(hourly_statement, { type: sequelize.QueryTypes.SELECT });

    let hourlyOneRates: any[] = [];
    let hourlyTwoRates: any[] = [];
    hourlyRatesResult.map(pool => {
      const [oneReserves, twoReserves] = makePairRates(pool.reservePairs);
      hourlyOneRates.push({
        'timestamp': pool.date,
        ...oneReserves
      });
      hourlyTwoRates.push({
        'timestamp': pool.date,
        ...twoReserves
      });
    });
    
    return { dailyPoolData, dailyOneRates, dailyTwoRates, hourlyOneRates, hourlyTwoRates };
  } 
}
