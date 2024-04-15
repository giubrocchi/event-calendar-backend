module.exports = (app) => {
  const user = require('../controllers/user.js');
  const router = require('express').Router();

  router.post('/', user.create);
  router.post('/login', user.login);

  app.use('/user', router);
};
