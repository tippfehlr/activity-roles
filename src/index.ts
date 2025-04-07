// SPDX-License-Identifier: AGPL-3.0-only

import { initDB } from './modules/db';
import { connect } from './modules/bot';

async function main() {
  await initDB();
  await connect();
}

main();
