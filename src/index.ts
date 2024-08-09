import { db, initDB } from './modules/db';
import { connect } from './modules/bot';
import { writeApi } from './modules/metrics';
import { uploadCommands } from './modules/syncCommands';
import config from './modules/config';

export async function close() {
  console.log('quitting ...');
  if (writeApi) await writeApi.close();
  await db.destroy();
  process.exit(0);
}

async function main() {
  process.on('SIGINT', close);
  process.on('SIGTERM', close);

  if (!config.SKIP_COMMAND_UPLOAD) await uploadCommands();
  await initDB();
  await connect();
}

main();
