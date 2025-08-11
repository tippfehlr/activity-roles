// SPDX-License-Identifier: AGPL-3.0-only

import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	db.schema.alterTable('guilds').addColumn('lastCheckRoles', 'timestamp').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	db.schema.alterTable('guilds').dropColumn('lastCheckRoles').execute();
}
