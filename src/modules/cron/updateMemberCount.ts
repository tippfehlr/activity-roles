import { client } from '../bot';
import { db } from '../db';

export async function updateMemberCount() {
	const guildsToUpdate = await db
		.selectFrom('guilds')
		.select(['guildID'])
		.where(eb =>
			eb.or([
				eb(
					'approxMemberCountLastUpdate',
					'<',
					new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
				),
				eb('approxMemberCountLastUpdate', 'is', null),
				eb('approxMemberCount', 'is', null),
			]),
		)
		.execute();
	await client.guilds.fetch();
	for (const dbGuild of guildsToUpdate) {
		const guild = client.guilds.cache.get(dbGuild.guildID);
		if (!guild) continue;
		await guild.members.fetch();
		await db
			.updateTable('guilds')
			.set({
				approxMemberCount: guild.memberCount,
				approxMemberCountLastUpdate: new Date(),
			})
			.where('guildID', '=', dbGuild.guildID)
			.execute();
	}
}
