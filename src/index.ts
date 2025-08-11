// SPDX-License-Identifier: AGPL-3.0-only

import { initDB } from './modules/db';
import { initBot } from './modules/bot';
import { log } from './modules/messages';

process.on('unhandledRejection', (reason, _) => {
	log.error(reason);
});

async function main() {
	await initDB();
	initBot();
}

main();
