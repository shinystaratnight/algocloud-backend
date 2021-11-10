export default (app) => {
  app.get(
    `/superadmin/user`,
    require('./userList').default,
  );

  app.put(
    `/superadmin/user/:userId/toggle-status`,
    require('./userUpdateStatus').default,
  );
};
  