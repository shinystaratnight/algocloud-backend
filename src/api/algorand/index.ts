export default (app) => {
  app.get(
    `/tenant/:tenantId/algorand/general-stats`,
    require('./algostats/algoStatistics').default,
  );

  app.get(
    `/tenant/:tenantId/algorand/assets`,
    require('./assets/algoAssets').default,
  );

  app.get(
    `/tenant/:tenantId/algorand/pools`,
    require('./pools/algoPools').default,
  );

  app.get(
    `/tenant/:tenantId/algorand/asset/:assetId`,
    require('./assets/algoAssetDetail').default,
  );

  app.get(
    `/tenant/:tenantId/algorand/pool/:address`,
    require('./pools/algoPoolDetail').default,
  );
};
