export default (app) => {
  app.get(
    `/tenant/:tenantId/algorand/general-stats`,
    require('./algostats/algoStatistics').default,
  );
};
