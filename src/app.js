import express from 'express';
import path from 'path';
import exphbs from 'express-handlebars';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import flash from 'connect-flash';
import mongoose from 'mongoose';
import session from 'express-session';
import morgan from 'morgan';
import routes from './routes';
import config from '../config/default';

const app = express();
const absolutePath = path.join.bind(path, __dirname);
const hbs = exphbs.create({
  extname: '.hbs',
  defaultLayout: 'main',
  partialsDir: [absolutePath('views/partials')],
  layoutsDir: absolutePath('views/layouts/'),
  compilerOptions: { preventIndent: true },
});

mongoose.connect(config.db.local.path);

app.engine('hbs', hbs.engine);

app.set('view engine', 'hbs');
app.set('views', absolutePath('views'));

app.use('/assets', express.static(path.join(__dirname, '../dist')));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: 'mongoosereactform',
  resave: false,
  saveUninitialized: true,
}));
app.use(flash());

routes(app);

export default app;
