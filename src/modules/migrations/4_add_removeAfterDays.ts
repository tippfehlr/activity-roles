// SPDX-FileCopyrightText: 2021 tippfehlr <tippfehlr@tippfehlr.dev>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.alterTable('activityRoles').addColumn('removeAfterDays', 'integer').execute();
	await db.schema
		.createTable('scheduledRoleActions')
		.addColumn('action', 'text', col => col.notNull())
		.addColumn('guildID', 'text', col => col.notNull())
		.addColumn('roleID', 'text', col => col.notNull())
		.addColumn('userID', 'text', col => col.notNull())
		.addColumn('scheduledDate', 'timestamp', col => col.notNull())
		.addPrimaryKeyConstraint('scheduledRoleActions_0', ['action', 'guildID', 'roleID'])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.alterTable('activityRoles').dropColumn('removeAfterDays').execute();
	await db.schema.dropTable('scheduledRoleActions').execute();
}
