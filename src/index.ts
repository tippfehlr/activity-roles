import { db, initDB } from './modules/db';
import { connect } from './modules/bot';
import { writeApi } from './modules/metrics';

export async function close() {
  console.log('quitting ...');
  if (writeApi) await writeApi.close();
  await db.destroy();
  process.exit(0);
}

async function main() {
  process.on('SIGINT', close);
  process.on('SIGTERM', close);

  await initDB();
  await connect();
}

main();
