import { IRepositoryOptions } from './IRepositoryOptions';
import _ from 'lodash';
import moment from 'moment';
import SequelizeRepository from './sequelizeRepository';


const makeOHLC = (arr) => {
  const sortedArr = _.sortBy(_.chain(arr).map((v) => v || 0).value());
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

  // static async getStatistics(
  //   options: IRepositoryOptions,
  // ) {
  //   const {sequelize} = options.database;

  //   const from = moment().subtract(365, 'days').format('YYYY-MM-DD');
  //   const to = moment().format('YYYY-MM-DD');

  //   const daily_stats_statement = `select distinct on (date_trunc('day', "createdDate")) "totalLiquidity", "lastDayVolume", ` +
  //     `date("createdDate") as "createdDate" from "algoHistory" where date_trunc('day', "createdDate") in ` + 
  //     `(SELECT (generate_series('${from}', '${to}', '1 day'::interval))::DATE)`;
  //   const dailyData = await sequelize.query(daily_stats_statement, { type: sequelize.QueryTypes.SELECT });

  //   const weekly_stats_statement = `select sum("lastDayVolume") as "lastWeekVolume", date(date_trunc('week', "createdDate"::date)) as "week" ` +
  //     `from "algoHistory" where id in (select distinct on (date_trunc('day', "createdDate")) id from "algoHistory" ` +
  //     `where date_trunc('day', "createdDate") in (select (generate_series('${from}', '${to}', '1 day'::interval))::date)) group by "week" order by "week"`;
  //   const weeklyData = await sequelize.query(weekly_stats_statement, { type: sequelize.QueryTypes.SELECT });

  //   const top_assets_statement = `select * from "algoAssetHistory" where id >= (select id from "algoAssetHistory" where "unitName"='ALGO' ` + `
  //     order by "createdDate" desc limit 1) order by id limit 10;`;
  //   const topAssets = await sequelize.query(top_assets_statement, { type: sequelize.QueryTypes.SELECT });

  //   const top_pools_statement = `select * from "algoPoolHistory" where id >= (select id from "algoPoolHistory" where ` +
  //     `"assetOneUnitName"='USDC' and "assetTwoUnitName"='ALGO' order by "createdDate" desc limit 1) order by id limit 10;`;
  //   const topPools = await sequelize.query(top_pools_statement, { type: sequelize.QueryTypes.SELECT });

  //   return { dailyData, weeklyData, topAssets, topPools };
  // }


  static async getOverview(
    options: IRepositoryOptions,
    {
      favoriteFilter,
      assetFilter,
      poolFilter,
    },
  ) {
    const {sequelize} = options.database;
    const currentUser = options.currentUser;
    
    const ALGO_VALUE = 0;
    
    const from = moment().subtract(365, 'days').format('YYYY-MM-DD');
    const to = moment().format('YYYY-MM-DD');
    
    // statement = `select distinct on (date_trunc('day', "createdDate")) "totalLiquidity", "lastDayVolume", ` +
    //   `date("createdDate") as "createdDate" from "algoHistory" where date_trunc('day', "createdDate") in ` + 
    //   `(SELECT (generate_series('${from}', '${to}', '1 day'::interval))::DATE)`;
    // const dailyData = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });

    // statement = `select sum("lastDayVolume") as "lastWeekVolume", date(date_trunc('week', "createdDate"::date)) as "week" ` +
    //   `from "algoHistory" where id in (select distinct on (date_trunc('day', "createdDate")) id from "algoHistory" ` +
    //   `where date_trunc('day', "createdDate") in (select (generate_series('${from}', '${to}', '1 day'::interval))::date)) group by "week" order by "week"`;
    // const weeklyData = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });

    let statement = `select * from "algoAssetHistory" where id >= (select id from "algoAssetHistory" where "unitName"='ALGO' ` +
      `order by "createdDate" desc limit 1) order by ${assetFilter.orderBy} limit ${assetFilter.limit} offset ${assetFilter.offset}`;
    const assets = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });
    statement = `select count(*) as count from "algoAssetHistory" where id >= (select id from "algoAssetHistory" where "unitName"='ALGO' ` +
      `order by "createdDate" desc limit 1)`;
    let result = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });
    const assetCount = result.length > 0 ? result[0].count : 0;

    statement = `select * from "algoPoolHistory" where id >= (select id from "algoPoolHistory" where "assetOneUnitName"='USDC' and ` +
      `"assetTwoUnitName"='ALGO' order by "createdDate" desc limit 1) ` +
      `order by ${poolFilter.orderBy} limit ${poolFilter.limit} offset ${poolFilter.offset}`;
    const pools = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });
    statement = `select count(*) as count from "algoPoolHistory" where id >= (select id from "algoPoolHistory" ` +
      `where "assetOneUnitName"='USDC' and "assetTwoUnitName"='ALGO' order by "createdDate" desc limit 1)`;
    result = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });
    const poolCount = result.length > 0 ? result[0].count : 0;

    statement = `select * from "algoAssetHistory" where (id >= (select id from "algoAssetHistory" where "unitName"='ALGO' ` +
      `order by "createdDate" desc limit 1)) and ("assetId" in (select "assetId" from "algoFavorites" where ` +
      `"userId"='${currentUser.id}' limit ${favoriteFilter.limit} offset ${favoriteFilter.offset})) order by ${favoriteFilter.orderBy}`;
    const favorites = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });
    statement = `select count(*) as count from "algoAssetHistory" where ` +
      `(id >= (select id from "algoAssetHistory" where "unitName"='ALGO' order by "createdDate" desc limit 1)) ` +
      `and ("assetId" in (select "assetId" from "algoFavorites" where "userId"='${currentUser.id}'))`
    result = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });
    const favoriteCount = result.length > 0 ? result[0].count : 0;

    statement = `select "assetId" from "algoShowcases" where "userId"='${currentUser.id}'`;
    result = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });
    const showcaseAssetId = result.length > 0 ? result[0].assetId : ALGO_VALUE;

    statement = `select * from "algoAssetHistory" where "assetId"='${showcaseAssetId}' order by "createdDate" desc`;
    result = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });
    const showcase = result[0];

    statement = `select distinct on (date_trunc('day', "createdDate")) "liquidity", "lastDayVolume", ` +
      `extract(epoch from date_trunc('day', "createdDate")) as "date" ` + 
      `from "algoAssetHistory" where "assetId"='${showcaseAssetId}' and date_trunc('day', "createdDate") ` +
      `in (SELECT (generate_series('${from}', '${to}', '1 day'::interval))::DATE);`
    const dailyData = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });

    return {
      dailyData,
      showcase,
      favorites,
      assets,
      pools,
      favoriteCount,
      assetCount,
      poolCount,
    };
  }

  static async putFavorite(
    options: IRepositoryOptions,
    assetId,
  ) {
    const currentUser = options.currentUser;
    const transaction = SequelizeRepository.getTransaction(options);

    const record = await options.database.algoFavorite.findOne(
      {
        where: {
          assetId,
          userId: currentUser.id,
        },
        transaction,
      },
    );

    if (!record) {
      await options.database.algoFavorite.create(
        {
          assetId,
          userId: currentUser.id,
        },
        {
          transaction,
        }
      )
    }
    else {
      await record.destroy({
        transaction,
      });
    }

    return { 'result': 'ok' };
  }

  static async putShowcase(
    options: IRepositoryOptions,
    assetId,
  ) {
    const currentUser = options.currentUser;
    const transaction = SequelizeRepository.getTransaction(options);

    const record = await options.database.algoShowcase.findOne(
      {
        where: {
          userId: currentUser.id,
        },
        transaction,
      },
    );

    if (record) {
      await record.destroy({
        transaction,
      });
    }
    
    await options.database.algoShowcase.create(
      {
        assetId,
        userId: currentUser.id,
      },
      {
        transaction,
      }
    );
    
    return { 'result': 'ok' };
  }

  // static async getShowcase(
  //   options: IRepositoryOptions,
  // ) {
  //   const {sequelize} = options.database;
  //   const currentUser = options.currentUser;

  //   const ALGO_VALUE = 0;

  //   const showcase_statement = `select "assetId" from "algoShowcases" where "userId"='${currentUser.id}'`;
  //   const result = await sequelize.query(showcase_statement, { type: sequelize.QueryTypes.SELECT });
  //   const assetId = result.length > 0 ? result[0].assetId : ALGO_VALUE;

  //   const showcase_name_statement = `select "name", "unitName" from "algoAssetHistory" where "assetId"='${assetId}' order by "createdDate" desc`;
  //   const showcaseNameResult = await sequelize.query(showcase_name_statement, { type: sequelize.QueryTypes.SELECT });
  //   const showcaseName = showcaseNameResult.length > 0 ? showcaseNameResult[0].unitName : '';

  //   const startDate = moment().subtract(365, 'days').format('YYYY-MM-DD');
  //   const endDate = moment().format('YYYY-MM-DD');

  //   const statement = `select distinct on (date_trunc('day', "createdDate")) "liquidity", "lastDayVolume", ` +
  //     `extract(epoch from date_trunc('day', "createdDate")) as "date" ` + 
  //     `from "algoAssetHistory" where "assetId"='${assetId}' and date_trunc('day', "createdDate") ` +
  //     `in (SELECT (generate_series('${startDate}', '${endDate}', '1 day'::interval))::DATE);`
  //   const showcaseData = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });

  //   const top_assets_statement = `select * from "algoAssetHistory" where id >= (select id from "algoAssetHistory" where "unitName"='ALGO' ` + `
  //     order by "createdDate" desc limit 1) order by id limit 10;`;
  //   const topAssets = await sequelize.query(top_assets_statement, { type: sequelize.QueryTypes.SELECT });

  //   const top_pools_statement = `select * from "algoPoolHistory" where id >= (select id from "algoPoolHistory" where ` +
  //     `"assetOneUnitName"='USDC' and "assetTwoUnitName"='ALGO' order by "createdDate" desc limit 1) order by id limit 10;`;
  //   const topPools = await sequelize.query(top_pools_statement, { type: sequelize.QueryTypes.SELECT });

  //   return { showcaseData, showcaseId: assetId, showcaseName, topAssets, topPools };
  // }

  // static async setShowcase(
  //   options: IRepositoryOptions,
  //   assetId,
  // ) {
  //   const {sequelize} = options.database;
  //   const currentUser = options.currentUser;

  //   const transaction = SequelizeRepository.getTransaction(
  //     options,
  //   );

  //   const record = await options.database.algoShowcase.findOne(
  //     {
  //       where: {
  //         userId: currentUser.id,
  //       },
  //       transaction,
  //     },
  //   );

  //   if (record) {
  //     await record.destroy({
  //       transaction,
  //     });
  //   }
    
  //   await options.database.algoShowcase.create(
  //     {
  //       assetId,
  //       userId: currentUser.id,
  //     },
  //     {
  //       transaction,
  //     }
  //   );


  //   const showcase_name_statement = `select "name", "unitName" from "algoAssetHistory" where "assetId"='${assetId}' order by "createdDate" desc`;
  //   const showcaseNameResult = await sequelize.query(showcase_name_statement, { type: sequelize.QueryTypes.SELECT });
  //   const showcaseName = showcaseNameResult.length > 0 ? showcaseNameResult[0].unitName : '';

  //   const startDate = moment().subtract(365, 'days').format('YYYY-MM-DD');
  //   const endDate = moment().format('YYYY-MM-DD');

  //   const statement = `select distinct on (date_trunc('day', "createdDate")) "liquidity", "lastDayVolume", ` +
  //     `extract(epoch from date_trunc('day', "createdDate")) as "date" ` + 
  //     `from "algoAssetHistory" where "assetId"='${assetId}' and date_trunc('day', "createdDate") ` +
  //     `in (SELECT (generate_series('${startDate}', '${endDate}', '1 day'::interval))::DATE);`
  //   const showcaseData = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });

  //   return { showcaseId: assetId, showcaseName, showcaseData };
  // }

  static async getFavorites(
    options: IRepositoryOptions,
  ) {
    const {sequelize} = options.database;
    const currentUser = options.currentUser;

    const fav_statement = `select array_agg("assetId") as "assets" from "algoFavorites" where "userId"='${currentUser.id}'`;
    const favResult = await sequelize.query(fav_statement, { type: sequelize.QueryTypes.SELECT });
    const list = favResult[0].assets ?? [];

    const top_fav_statement = `select *,  1 as "status" from "algoAssetHistory" where (id >= (select id from "algoAssetHistory" where "unitName"='ALGO'` +
      `order by "createdDate" desc limit 1)) and ("assetId" in (select "assetId" from "algoFavorites" where "userId"='${currentUser.id}'))`;
      // `limit 5`;
    const top = await sequelize.query(top_fav_statement, { type: sequelize.QueryTypes.SELECT });

    return { list, top };
  }
  
  static async getAssets(
    options: IRepositoryOptions,
  ) {
    const {sequelize} = options.database;

    const statement = `select * from "algoAssetHistory" where id >= (select id from "algoAssetHistory" where "unitName"='ALGO' ` +
      `order by "createdDate" desc limit 1) order by id`;
    const assets = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });

    return { list: assets };
  }


  static async getPools(
    options: IRepositoryOptions,
  ) {
    const {sequelize} = options.database;

    const statement = `select * from "algoPoolHistory" where id >= (select id from "algoPoolHistory" where ` +
      `"assetOneUnitName"='USDC' and "assetTwoUnitName"='ALGO' order by "createdDate" desc limit 1) order by id`;
    const pools = await sequelize.query(statement, { type: sequelize.QueryTypes.SELECT });

    return { list: pools };
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

    const detail_statement = `select * from "algoAssetHistory" where "assetId"='${assetId}' ` +
      `order by "createdDate" desc limit 1`;
    const detailResult = await sequelize.query(detail_statement, { type: sequelize.QueryTypes.SELECT });

    return { show: detailResult[0], dailyAssetData, dailyPrices, hourlyPrices, topPools };
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

    const detail_statement = `select * from "algoPoolHistory" where "address"='${address}' order by "createdDate" desc limit 1`;
    const detailResult = await sequelize.query(detail_statement, { type: sequelize.QueryTypes.SELECT });
    
    return { show: detailResult[0], dailyPoolData, dailyOneRates, dailyTwoRates, hourlyOneRates, hourlyTwoRates };
  }
}
