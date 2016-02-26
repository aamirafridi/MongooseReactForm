import demoFormHandler from './handlers/demoForm';

export default (app) => {
  app.get('/demo', demoFormHandler.demoForm);
  app.post('/save', demoFormHandler.saveForm);
};
