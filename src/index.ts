import { db, prepareDB } from './modules/db';
import { connect } from './modules/bot';
import { writeApi } from './modules/metrics';

prepareDB();
connect();

function close() {
  console.log('quitting ...');
  if (writeApi) writeApi.close();
  db.close();
  process.exit(0);
}

process.on('SIGINT', close);
process.on('SIGTERM', close);
