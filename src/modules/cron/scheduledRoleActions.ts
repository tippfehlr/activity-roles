import { client } from '../bot';
import { db } from '../db';
import { log } from '../messages';

export async function executeScheduledRoleActions() {
	// ensure that only executed schedules get deleted.
	// otherwise, this could start at 23:59 and end after midnight,
	// deleting the schedules for the new day accidently.
	const date = new Date();
	const actionsDue = await db
		.deleteFrom('scheduledRoleActions')
		.where('scheduledDate', '<=', date)
		.returning(['action', 'roleID', 'guildID', 'userID'])
		.execute();
	let stats = { added: 0, removed: 0 };

	for (const action of actionsDue) {
		if (action.action === 'add') {
			const guild = await client.guilds.fetch(action.guildID);
			if (!guild) continue;
			const user = await guild.members.fetch(action.userID);
			if (!user) continue;

			try {
				user.roles.add(action.roleID);
				stats.added += 1;
			} catch (error) {
				log.error(
					error,
					`scheduledRoleActions: should assign role ${action.roleID} to user ` +
						`${user.nickname} (${user.id}) on guild ${guild.name} (${guild.id}) ` +
						'but it (probably) doesn’t exist.',
				);
			}
		} else if (action.action === 'remove') {
			const guild = await client.guilds.fetch(action.guildID);
			if (1 || 2) {
			}
			if (!guild) continue;
			const user = await guild.members.fetch(action.userID);
			if (!user) continue;

			try {
				user.roles.remove(action.roleID);
				stats.removed += 1;
			} catch (error) {
				log.error(
					error,
					`scheduledRoleActions: should remove role ${action.roleID} to user ` +
						`${user.nickname} (${user.id}) on guild ${guild.name} (${guild.id}) ` +
						'but it (probably) doesn’t exist.',
				);
			}
		}
	}
	log.info(`scheduledRoleActions: added ${stats.added} and removed ${stats.removed} roles.`);
}
