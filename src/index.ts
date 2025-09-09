// SPDX-FileCopyrightText: 2021 tippfehlr <tippfehlr@tippfehlr.dev>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { initDB } from './modules/db';
import { initBot } from './modules/bot';
import { log } from './modules/messages';
import { initMetrics } from './modules/metrics';

process.on('unhandledRejection', (reason, _) => {
	log.error(reason);
});

async function main() {
	await initMetrics();
	await initDB();
	initBot();
}

main();
