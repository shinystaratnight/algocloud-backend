export default (app) => {
  
  app.get(
    `/tenant/:tenantId/algorand/overview`,
    require('./overview/algoOverview').default,
  );

  app.get(
    `/tenant/:tenantId/algorand/general-stats`,
    require('./algostats/algoStatistics').default,
  );

  app.get(
    `/tenant/:tenantId/algorand/showcase`,
    require('./assets/algoShowcase').default,
  );

  app.get(
    `/tenant/:tenantId/algorand/favorites`,
    require('./favorites/algoFavorites').default,
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

  app.put(
    `/tenant/:tenantId/algorand/favorite/:assetId/toggle`,
    require('./favorites/algoToggleFavorite').default,
  );

  app.put(
    `/tenant/:tenantId/algorand/:assetId/set-showcase`,
    require('./assets/algoSetShowcase').default,
  );
};
