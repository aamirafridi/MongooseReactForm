import React from 'react';
import ReactDOMServer from 'react-dom/server';
import Iso from 'iso';
import DemoModal from '../models/demoModal';
import DemoForm from '../ui/DemoForm';
import {mongooseSchemaConverter} from '../ui/MongooseReactForm';

export default {
  demoForm(req, res) {
    const success = req.flash('formDataSuccess')[0] || '';
    const errors = req.flash('formDataErrors')[0] || {};
    const iso = new Iso({
      markupClassName: '___iso-html-demoform___',
      dataClassName: '___iso-state-demoform___',
    });
    const formData = {
      schema: mongooseSchemaConverter(DemoModal),
      saveEndpoint: '/save',
      errors,
      success,
    };
    const FormApp = React.createElement(DemoForm, formData);
    const DemoFormMarkup = ReactDOMServer.renderToString(FormApp);
    iso.add(DemoFormMarkup, formData);
    return res.render('react', {
      assets: { js: [ '/assets/js/DemoForm.js' ] },
      markup: iso.render(),
    });
  },

  saveForm(req, res) {
    const formData = new DemoModal(req.body);
    formData.save((err) => {
      const success = { message: 'Form saved successfully!' };
      if (err) {
        const errors = {};
        for (const error in err.errors) {
          if (err.errors.hasOwnProperty(error)) {
            errors[error] = err.errors[error].message;
          }
        }
        if (req.xhr) {
          return res.json(500, errors);
        }
        console.log("====================================================================");
        console.log(err);
        console.log("====================================================================");
        console.log(errors);
        console.log("====================================================================");
        req.flash('formDataErrors', errors);
        return res.redirect('/demo');
      }
      // success
      if (req.xhr) {
        return res.json(500, success);
      }
      req.flash('formDataSuccess', success.message);
      return res.redirect('/demo');
    });
  },
};
