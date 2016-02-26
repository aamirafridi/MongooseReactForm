import React from 'react';
import Iso from 'iso';
import ReactDOM from 'react-dom';
import DemoForm from '../DemoForm';

process.env.BROWSER = true;
Iso.bootstrap((state, meta, container) => {
  const DemoFormApp = React.createElement(DemoForm, state);
  ReactDOM.render(DemoFormApp, container, meta.iso);
}, {
  markupClassName: '___iso-html-demoform___',
  dataClassName: '___iso-state-demoform___',
});
