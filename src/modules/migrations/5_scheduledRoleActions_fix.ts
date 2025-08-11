// SPDX-License-Identifier: AGPL-3.0-only

import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('scheduledRoleActions')
		.dropConstraint('scheduledRoleActions_0')
		.execute();
	await db.schema
		.alterTable('scheduledRoleActions')
		.addPrimaryKeyConstraint('scheduledRoleActions_0', [
			'action',
			'guildID',
			'roleID',
			'userID',
		])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('scheduledRoleActions')
		.dropConstraint('scheduledRoleActions_0')
		.execute();
	await db.schema
		.alterTable('scheduledRoleActions')
		.addPrimaryKeyConstraint('scheduledRoleActions_0', ['action', 'guildID', 'roleID'])
		.execute();
}
