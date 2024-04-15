module.exports = (app) => {
  const event = require('../controllers/event.js');
  const router = require('express').Router();

  router.post('/', event.create);
  router.get('/calendar/:userId', event.getCalendarFromUser);
  router.get('/:id', event.getEvent);
  router.put('/:id', event.update);
  router.delete('/:id', event.delete);

  app.use('/event', router);
};
