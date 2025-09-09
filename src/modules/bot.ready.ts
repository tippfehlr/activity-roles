// SPDX-FileCopyrightText: 2021 tippfehlr <tippfehlr@tippfehlr.dev>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ActivitiesOptions, ActivityType } from 'discord.js';

import { client } from './bot';
import CommandHandler from './commandHandler';
import config from './config';
import { getUserCount, getRolesCount } from './db';
import { i18n, log } from './messages';
import { cron } from './cron';

import activityStats from './commands/activityStats';
import addActivityRole from './commands/addActivityRole';
import checkRoles from './commands/checkRoles';
import deleteActivityRole from './commands/deleteActivityRole';
import deleteStatusRole from './commands/deleteStatusRole';
import _export from './commands/export';
import help from './commands/help';
import listRoles from './commands/listRoles';
import requireRole from './commands/requireRole';
import reset from './commands/reset';
import setStatusRole from './commands/setStatusRole';
import stats from './commands/stats';
import toggleAutoRole from './commands/toggleAutoRole';

export let commandHandler: CommandHandler;

const presences: Array<() => Promise<ActivitiesOptions>> = [
	async () => {
		return {
			name: i18n.__n({
				singular: '%s guild',
				plural: '%s guilds',
				locale: 'en-US',
				count: client.guilds.cache.size,
			}),
			type: ActivityType.Watching,
		};
	},
	async () => {
		return {
			name: i18n.__n({
				singular: '%s role',
				plural: '%s roles',
				locale: 'en-US',
				count: await getRolesCount(),
			}),
			type: ActivityType.Watching,
		};
	},
];
let currentPresenceIndex = 0;

async function cyclePresence() {
	currentPresenceIndex = (currentPresenceIndex + 1) % presences.length;
	client.user?.setPresence({
		status: 'online',
		afk: false,
		activities: [await presences[currentPresenceIndex]()],
	});
}

export async function clientReady() {
	commandHandler = new CommandHandler(client)
		.addCommand(activityStats)
		.addCommand(addActivityRole)
		.addCommand(checkRoles)
		.addCommand(deleteActivityRole)
		.addCommand(deleteStatusRole)
		.addCommand(_export)
		.addCommand(help)
		.addCommand(listRoles)
		.addCommand(requireRole)
		.addCommand(reset)
		.addCommand(setStatusRole)
		.addCommand(stats)
		.addCommand(toggleAutoRole);
	if (!config.SKIP_COMMAND_UPLOAD) await commandHandler.uploadCommands();

	cyclePresence();
	setInterval(cyclePresence, 10 * 1000);

	log.info(
		`Logged in as ${client.user?.username}#${client.user?.discriminator} (${client.user?.id})`,
	);
	log.info(
		`The bot is currently in ${client.guilds.cache.size} guilds with ${await getUserCount()} users and manages ${await getRolesCount()} roles`,
	);
	cron();
}
