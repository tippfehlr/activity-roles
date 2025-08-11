// SPDX-License-Identifier: AGPL-3.0-only

import {
	Client,
	CommandInteraction,
	InteractionType,
	SlashCommandBuilder,
	REST,
	Routes,
	MessageFlags,
} from 'discord.js';

import config from './config';
import { getLang } from './db';
import { log, __ } from './messages';

export interface Command {
	data: SlashCommandBuilder;
	execute(interaction: CommandInteraction): Promise<void>;
}

export default class CommandHandler {
	private client: Client;
	public commands: Map<Command['data']['name'], Command>;

	constructor(client: Client) {
		this.client = client;
		this.commands = new Map();

		client.on('interactionCreate', async interaction => {
			if (interaction.type !== InteractionType.ApplicationCommand) return;
			const command = this.commands.get(interaction.commandName);
			if (!command) return;
			try {
				command.execute(interaction);
			} catch (error) {
				log.error(error, 'Error while executing command' + command.data.name);
				try {
					if (interaction.replied) {
						await interaction.editReply({
							content: __({
								phrase: 'There was an error while executing this command!',
								locale: getLang(interaction),
							}),
						});
					} else {
						await interaction.reply({
							content: __({
								phrase: 'There was an error while executing this command!',
								locale: getLang(interaction),
							}),
							flags: MessageFlags.Ephemeral,
						});
					}
				} catch (error) {
					log.error(error, 'Error replying');
				}
			}
		});
	}

	public addCommand(command: Command) {
		this.commands.set(command.data.name, command);
		return this;
	}

	public async uploadCommands() {
		let commandsJSON: any[] = [];

		log.debug(`Uploading ${this.commands.size} application (/) commands:`);
		for (const [, command] of this.commands) {
			log.debug('  - ' + command.data.name);
			commandsJSON.push(command.data.toJSON());
		}

		const rest = new REST().setToken(config.TOKEN);

		let data: any;
		if (config.GUILD) {
			data = await rest.put(
				Routes.applicationGuildCommands(config.APPLICATION_ID, config.GUILD),
				{
					body: commandsJSON,
				},
			);
			log.info(`Uploaded ${data.length} application (/) commands to guild ${config.GUILD}.`);
		} else {
			data = await rest.put(Routes.applicationCommands(config.APPLICATION_ID), {
				body: commandsJSON,
			});
			log.info(`Uploaded ${data.length} application (/) commands to global.`);
		}
		return this;
	}
}
