// SPDX-License-Identifier: AGPL-3.0-only

import { db, initDB } from './modules/db';
import { connect } from './modules/bot';
import { writeApi } from './modules/metrics';
import config from './modules/config';

// npm and pnpm invoke SIGINT twice when ^C is pressed.
let closed = false;

export async function close() {
  if (closed) return;
  closed = true;
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
