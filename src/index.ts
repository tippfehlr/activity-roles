import config from '../config';
import * as db from './modules/db';
import { connect as discordJSConnect } from './modules/bot';

db.connect(config.MONGODB_URI);
discordJSConnect();

export {};
