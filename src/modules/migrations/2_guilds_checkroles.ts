// SPDX-FileCopyrightText: 2021 tippfehlr <tippfehlr@tippfehlr.dev>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	db.schema.alterTable('guilds').addColumn('lastCheckRoles', 'timestamp').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	db.schema.alterTable('guilds').dropColumn('lastCheckRoles').execute();
}
