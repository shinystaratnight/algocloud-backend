/**
 * This script is responsible for create the SQL tables.
 * Run it via `npm run db:create`.
 */
require('dotenv').config();
import bcrypt from 'bcrypt';
import models from '../models';

const BCRYPT_SALT_ROUNDS = 12
const database = models();
database
  .sequelize.sync()
  .then(() => {
    bcrypt.hash(
      process.env.SUPERADMIN_PASSWORD,
      BCRYPT_SALT_ROUNDS,
    ).then((hashedPassword) => {
      database['user'].create({
        firstName: 'admin',
        email: process.env.SUPERADMIN_EMAIL,
        password: hashedPassword,
        emailVerified: true,
        active: true,
        superadmin: true,
      }).then((user) => {
        database['settings'].create({
          id: user.id,
          theme: 'default',
          createdById: user.id,
          updatedById: user.id,
        }).then(() => {
          console.log('OK');
          process.exit();
        });
        // .catch((error) => {
        //   console.error(error);
        //   process.exit(1);
        // });
      });
      // .catch((error) => {
      //   console.error(error);
      //   process.exit(1);
      // });
    });
    // .catch((error) => {
    //   console.error(error);
    //   process.exit(1);
    // });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
