import { client } from '../bot';
import { checkRolesStandalone } from '../commands/checkRoles';
import { db } from '../db';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function checkGuilds() {
	const guildsToCheck = await db
		.selectFrom('guilds')
		.select('guildID')
		.where('lastCheckRoles', '<', new Date(Date.now() - 20 * 60 * 60 * 1000))
		.orderBy('lastCheckRoles asc')
		.execute();
	await client.guilds.fetch();
	for (const { guildID } of guildsToCheck) {
		await delay(30 * 1000);
		const guild = client.guilds.cache.get(guildID);
		if (guild) await checkRolesStandalone({ guild });
	}
}
