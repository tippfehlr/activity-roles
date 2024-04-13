import { db, initDB } from './modules/db';
import { connect } from './modules/bot';
import { writeApi } from './modules/metrics';

async function main() {
  const close = async () => {
    console.log('quitting ...');
    if (writeApi) await writeApi.close();
    await db.destroy();
    process.exit(0);
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);

  await initDB();
  await connect();
}

main();
