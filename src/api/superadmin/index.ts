export default (app) => {
  app.get(
    `/superadmin/user`,
    require('./user/userList').default,
  );

  app.put(
    `/superadmin/user/:userId/toggle-status`,
    require('./user/userUpdateStatus').default,
  );

  app.get(
    `/superadmin/tenant`,
    require('./tenant/tenantList').default,
  );

  app.post(
    `/superadmin/tenant`,
    require('./tenant/tenantCreate').default,
  );

  app.delete(
    `/superadmin/tenant`,
    require('./tenant/tenantDestroy').default,
  );

  app.get(
    `/superadmin/analytics`,
    require('./analytics/analytics').default,
  )
};
