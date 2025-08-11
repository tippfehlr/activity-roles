// SPDX-License-Identifier: AGPL-3.0-only

/*
 *  This file is commented out to remove the dependency on better-sqlite3,
 *  as it takes relatively long to compile the C bindings.
 *
 *  Should you need to import from a sqlite database,
 *  uncomment this file and add better-sqlite3 as a dependency,
 *  then run the migrations.
 */

// import { Kysely } from 'kysely';
// import sqlite3 from 'better-sqlite3';
// import fs from 'fs';

export async function up(/* db: Kysely<any> */): Promise<void> {
	// if (fs.existsSync('db/activity-roles.db')) {
	//   const sqlite = new sqlite3('db/activity-roles.db');
	//
	//   for (const role of sqlite.prepare('SELECT * FROM activeTemporaryRoles').all()) {
	//     await db
	//       .insertInto('activeTemporaryRolesHashed')
	//       .values(role as any)
	//       .execute();
	//   }
	//
	//   for (const role of sqlite.prepare('SELECT * FROM activityRoles').all()) {
	//     await db
	//       .insertInto('activityRoles')
	//       .values({
	//         guildID: (role as any).guildID,
	//         activityName: (role as any).activityName,
	//         roleID: (role as any).roleID,
	//         exactActivityName: Boolean((role as any).exactActivityName),
	//         permanent: !(role as any).live,
	//       })
	//       .execute();
	//   }
	//
	//   for (const activityStat of sqlite.prepare('SELECT * FROM activityStats').all()) {
	//     await db
	//       .insertInto('activityStats')
	//       .values(activityStat as any)
	//       .execute();
	//   }
	//
	//   for (const guild of sqlite.prepare('SELECT * FROM guilds').all()) {
	//     await db
	//       .insertInto('guilds')
	//       .values({
	//         guildID: (guild as any).guildID,
	//         requiredRoleID: (guild as any).requiredRoleID,
	//       })
	//       .execute();
	//   }
	//
	//   for (const statusRole of sqlite.prepare('SELECT * FROM statusRoles').all()) {
	//     await db
	//       .insertInto('statusRoles')
	//       .values(statusRole as any)
	//       .execute();
	//   }
	//
	//   for (const user of sqlite.prepare('SELECT * FROM users').all()) {
	//     await db
	//       .insertInto('usersHashed')
	//       .values({
	//         userIDHash: (user as any).userIDHash,
	//         autorole: (user as any).autoRole,
	//       })
	//       .execute();
	//   }
	// }
}

export async function down(/* db: Kysely<any> */): Promise<void> {
	// await db.deleteFrom('activeTemporaryRoles').execute();
	// await db.deleteFrom('activeTemporaryRolesHashed').execute();
	// await db.deleteFrom('activityRoles').execute();
	// await db.deleteFrom('activityStats').execute();
	// await db.deleteFrom('guilds').execute();
	// await db.deleteFrom('statusRoles').execute();
	// await db.deleteFrom('users').execute();
	// await db.deleteFrom('usersHashed').execute();
}
