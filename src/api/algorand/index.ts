export default (app) => {
  
  app.get(
    `/tenant/:tenantId/algorand/overview`,
    require('./algorandOverview').default,
  );

  app.put(
    `/tenant/:tenantId/algorand/favorite/:assetId`,
    require('./algorandFavorite').default,
  );

  app.put(
    `/tenant/:tenantId/algorand/showcase/:assetId`,
    require('./algorandShowcase').default,
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
};
