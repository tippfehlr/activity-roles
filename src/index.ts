// import { connect as mongoDBConnect } from './modules/db';
import { connect as discordJSConnect } from './modules/bot';

// mongoDBConnect();
discordJSConnect();
require('./modules/db').connect();

export {}