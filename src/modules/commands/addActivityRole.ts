// SPDX-FileCopyrightText: 2021 tippfehlr <tippfehlr@tippfehlr.dev>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { discordTranslations, i18nifyBoolean } from './../messages';
import {
	Role,
	CommandInteraction,
	PermissionsBitField,
	StringSelectMenuInteraction,
	InteractionType,
	EmbedBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	APIRole,
	SlashCommandBuilder,
	ComponentType,
	InteractionContextType,
	ChannelType,
	MessageFlags,
} from 'discord.js';

import { Command } from '../commandHandler';
import config from '../config';
import { log, __, i18n } from '../messages';
import { db, getLang } from '../db';

export default {
	data: new SlashCommandBuilder()
		.setName('addactivityrole')
		.setDescription('Adds an activity role to your guild.')
		.setDescriptionLocalizations(discordTranslations('Adds an activity role to your guild.'))
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
		.setContexts([InteractionContextType.Guild])
		.addStringOption(option =>
			option
				.setName('activity')
				.setDescription('addActivityRole->activityDescription')
				.setDescriptionLocalizations(
					discordTranslations('addActivityRole->activityDescription'),
				)
				.setRequired(true),
		)
		.addRoleOption(option =>
			option
				.setName('role')
				.setDescription(
					'If not provided, the bot will look for roles with the same name or create a new one',
				)
				.setDescriptionLocalizations(
					discordTranslations(
						'If not provided, the bot will look for roles with the same name or create a new one',
					),
				)
				.setRequired(false),
		)
		.addBooleanOption(option =>
			option
				.setName('exact')
				.setDescription(
					"If false, the activity name 'Chrome' would also trigger for 'Google Chrome'",
				)
				.setDescriptionLocalizations(
					discordTranslations(
						"If false, the activity name 'Chrome' would also trigger for 'Google Chrome'",
					),
				)
				.setRequired(false),
		)
		.addBooleanOption(option =>
			option
				.setName('permanent')
				.setDescription('the role will not be removed again if set to true')
				.setDescriptionLocalizations(
					discordTranslations('the role will not be removed again if set to true'),
				)
				.setRequired(false),
		)
		.addIntegerOption(option =>
			option
				.setName('remove_after_days')
				.setDescription(
					__({ phrase: 'addActivityRole->removeAfterDaysDescription', locale: 'en-US' }),
				)
				.setDescriptionLocalizations(
					discordTranslations('addActivityRole->removeAfterDaysDescription'),
				)
				.setRequired(false)
				.setMinValue(1),
		)
		.addStringOption(option =>
			option
				.setName('state')
				.setDescription(
					__({ phrase: 'addActivityRole->stateDescription', locale: 'en-US' }),
				)
				.setDescriptionLocalizations(
					discordTranslations('addActivityRole->stateDescription'),
				)
				.setRequired(false),
		)
		.addStringOption(option =>
			option
				.setName('details')
				.setDescription(
					__({ phrase: 'addActivityRole->detailsDescription', locale: 'en-US' }),
				)
				.setDescriptionLocalizations(
					discordTranslations('addActivityRole->detailsDescription'),
				)
				.setRequired(false),
		),
	execute: async interaction => {
		const locale = getLang(interaction);
		// the command cannot be used in DMs anyways
		if (
			!interaction.channel ||
			interaction.channel.type === ChannelType.GroupDM ||
			interaction.channel.type === ChannelType.DM
		) {
			return;
		}

		const activityName = interaction.options.get('activity', true)?.value as string;
		const state = interaction.options.get('state')?.value as string | undefined;
		const details = interaction.options.get('details')?.value as string | undefined;
		if (
			activityName.length > 100 ||
			(state && state.length > 100) ||
			(details && details.length > 100)
		) {
			await interaction.reply({
				content: __({ phrase: 'addActivityRole->activityNameTooLong', locale }, '100'),
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const exact =
			(interaction.options.get('exact', false)?.value as boolean | undefined) ?? false;
		const permanent =
			(interaction.options.get('permanent', false)?.value as boolean | undefined) ?? false;
		let role = interaction.options.get('role', false)?.role;
		const removeAfterDays = interaction.options.get('remove_after_days')?.value as
			| number
			| undefined;

		if (permanent === false && removeAfterDays !== undefined) {
			interaction.reply(
				__({ phrase: 'addActivityRole->removeAfterDaysButNotPermanent', locale }),
			);
			return;
		}

		if (!role) {
			// role not provided
			const possibleRoles = interaction.guild?.roles.cache.filter(role => {
				return role.name.toLowerCase().includes(activityName.toLowerCase());
			});
			if (!possibleRoles || possibleRoles.size === 0) {
				// create role
				role = await createRole(interaction, activityName);
				process(interaction, locale, {
					role,
					activityName,
					exact,
					permanent,
					removeAfterDays,
					state,
					details,
				});
			} else if (possibleRoles.size === 1) {
				// use role
				role = possibleRoles.first()!;
				process(interaction, locale, {
					role,
					activityName,
					exact,
					permanent,
					removeAfterDays,
					state,
					details,
				});
			} else {
				// select role
				const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('addactivityrole:roleSelector')
						.setPlaceholder(
							__(
								{
									phrase: "addActivityRole->roleselector:Please select a role for '%s'",
									locale,
								},
								activityName,
							),
						)
						.addOptions([
							...possibleRoles.map(role => {
								return {
									label: role.name,
									description: role.id,
									value: role.id,
								};
							}),
							{
								label: __(
									{ phrase: 'addActivityRole->createRole:Create %s', locale },
									activityName,
								),
								description: __(
									{
										phrase: "addActivityRole->createRoleDescription:Create a new role with the name '%s'",
										locale,
									},
									activityName,
								),
								value: 'create',
							},
						]),
				);
				interaction.channel
					.createMessageComponentCollector({
						componentType: ComponentType.StringSelect,
						filter: componentInteraction =>
							componentInteraction.customId === 'addactivityrole:roleSelector',
						time: 60000,
						max: 1,
					})
					.once('collect', async selectMenuInteraction => {
						if (selectMenuInteraction.user.id !== interaction.user.id) return;
						if (!selectMenuInteraction.isStringSelectMenu()) return;
						if (selectMenuInteraction.customId !== 'addactivityrole:roleSelector')
							return;
						if (selectMenuInteraction.values[0] === 'create') {
							role = await createRole(interaction, activityName);
						} else {
							role =
								selectMenuInteraction.guild!.roles.cache.get(
									selectMenuInteraction.values[0],
								) || null;
						}
						if (role) {
							process(selectMenuInteraction, locale, {
								role,
								activityName,
								exact,
								permanent,
								removeAfterDays,
								state,
								details,
							});
						}
					});
				interaction.reply({
					components: [row],
					flags: MessageFlags.Ephemeral,
				});
			}
		} else {
			process(interaction, locale, {
				role,
				activityName,
				exact,
				permanent,
				removeAfterDays,
				state,
				details,
			});
		}
	},
} as Command;

async function createRole(interaction: CommandInteraction, activityName: string) {
	return await interaction.guild!.roles.create({
		name: activityName,
		color: config.COLOR,
		mentionable: true,
	});
}

function reply(
	interaction: CommandInteraction | StringSelectMenuInteraction,
	content?: string,
	embeds?: EmbedBuilder[],
) {
	if (interaction.type === InteractionType.ApplicationCommand) {
		interaction.reply({ content, embeds, flags: MessageFlags.Ephemeral });
	} else if (interaction.isStringSelectMenu()) {
		interaction.update({ content, embeds, components: [] });
	}
}

async function process(
	interaction: CommandInteraction | StringSelectMenuInteraction,
	locale: string,
	r: {
		role: Role | APIRole;
		activityName: string;
		exact: boolean;
		permanent: boolean;
		removeAfterDays: number | undefined;
		state: string | undefined;
		details: string | undefined;
	},
) {
	if (!r.role) reply(interaction, __({ phrase: ':x: That role does not exist! :x:', locale }));
	if (r.role.name === '@everyone') {
		reply(
			interaction,
			__({ phrase: "You can't use \\@everyone as an activity role.", locale }),
		);
		return;
	}
	if (
		!interaction.guild?.members.me?.roles.highest?.position ||
		!interaction.guild.members.me.roles.highest.id
	)
		return;
	if (
		r.role.position &&
		interaction.guild.members.me?.roles.highest?.position &&
		r.role.position >= interaction.guild.members.me.roles.highest.position
	) {
		reply(
			interaction,
			__({ phrase: 'presenceUpdate->roleHigherThanBotRole', locale }, `<@&${r.role.id}>`),
		);
		return;
	}
	if (
		await db
			.selectFrom('activityRoles')
			.selectAll()
			.where('guildID', '=', interaction.guildId)
			.where('activityName', '=', r.activityName)
			.where('roleID', '=', r.role.id)
			.where('state', '=', r.state ?? null)
			.where('details', '=', r.details ?? null)
			.executeTakeFirst()
	) {
		reply(
			interaction,
			__({ phrase: ':x: That activity role already exists in this guild! :x:', locale }),
		);
		return;
	} else {
		db.insertInto('activityRoles')
			.values({
				guildID: interaction.guildId!,
				activityName: r.activityName,
				roleID: r.role.id,
				exact: r.exact,
				permanent: r.permanent,
				state: r.state ?? '',
				details: r.details ?? '',
			})
			.execute();
		log.info(
			`New activity role added: in guild ${interaction.guild.name} (${interaction.guild.id}) role: ${r.role.name} (${r.role.id}) activityName: ${r.activityName}, exact: ${r.exact}, permanent: ${r.permanent}, removeAfterDays: ${r.removeAfterDays}, state: ${r.state}, details: ${r.details}`,
		);
		reply(interaction, undefined, [
			new EmbedBuilder()
				.setColor(config.COLOR)
				.setTitle(__({ phrase: 'Success!', locale }))
				.addFields(
					{ name: __({ phrase: 'Activity', locale }), value: r.activityName },
					{ name: __({ phrase: 'Role', locale }), value: `<@&${r.role.id}>` },
					{
						name: __({ phrase: 'Exact', locale }),
						value: i18nifyBoolean(r.exact, locale),
					},
					{
						name: __({ phrase: 'Permanent', locale }),
						value: i18nifyBoolean(r.permanent, locale),
					},
					{
						name: __({ phrase: 'Remove roles', locale }),
						value: r.removeAfterDays
							? i18n.__n({
									singular: '%s day',
									plural: '%s days',
									locale,
									count: r.removeAfterDays,
								})
							: '-',
					},
					{ name: __({ phrase: 'State', locale }), value: r.state ?? '-' },
					{ name: __({ phrase: 'Details', locale }), value: r.details ?? '-' },
				),
		]);
	}
}
