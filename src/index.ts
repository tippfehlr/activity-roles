import db from './modules/db';
import { connect as discordJSConnect } from './modules/bot';

db.connect();
discordJSConnect();
// require('./modules/db').connect();

export {}