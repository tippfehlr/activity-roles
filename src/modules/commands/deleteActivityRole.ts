import { db, ActivityRoles } from '../db';
import { log } from '../messages';
//mention that no roles are removed and maybe there is an extra command

import { Command } from '../commandHandler';
import { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } from 'discord.js';

import config from '../../../config';

export default {
  name: 'deleteactivityrole',
  description:
    'Deletes an activity role from your guild. Provide the activity or the role, or both.',
  requiredPermissions: [PermissionsBitField.Flags.ManageRoles],

  testOnly: config.debug,
  guildOnly: true,

  options: [
    {
      name: 'role',
      description: 'the activity roles of this role will be deleted',
      required: false,
      type: ApplicationCommandOptionType.Role
    },
    {
      name: 'activity',
      description: 'the activity roles with this name will be deleted',
      required: false,
      type: ApplicationCommandOptionType.String
    }
  ],

  callback: async interaction => {
    const role = interaction.options.get('role')?.role;
    const activity = interaction.options.get('activity')?.value as string | undefined;

    let deleted: ActivityRoles[] = [];
    if (!role && !activity) {
      return interaction.reply({
        content:
          'You need to provide a role or an activity. If you provide a role, all activity roles for that role will be deleted. If you provide an activity, all activity roles with that name will be deleted.\nIf you provide both, all activity roles with that name for that role will be deleted.',
        ephemeral: true
      });
    } else if (role && !activity) {
      deleted = db.prepare('SELECT * FROM activityRoles WHERE roleID = ?').all(role.id);
      db.prepare('DELETE FROM activityRoles WHERE roleID = ?').run(role.id);
    } else if (!role && activity) {
      deleted = db.prepare('SELECT * FROM activityRoles WHERE activityName = ?').all(activity);
      db.prepare('DELETE FROM activityRoles WHERE activityName = ?').run(activity);
    } else if (role && activity) {
      deleted = db
        .prepare('SELECT * FROM activityRoles WHERE roleID = ? AND activityName = ?')
        .all(role.id, activity);
      db.prepare('DELETE FROM activityRoles WHERE roleID = ? AND activityName = ?').run(
        role.id,
        activity
      );
    }

    if (deleted.length > 0) {
      const embeds = [
        // new EmbedBuilder().setTitle('Deleted Activity Roles:').setColor(config.botColor)
      ];
      embeds.push(
        ...deleted.map(activityRole => {
          return new EmbedBuilder()
            .addFields(
              { name: 'Activity', value: activityRole.activityName, inline: true },
              { name: 'Role', value: `<@&${activityRole.roleID}>`, inline: true },
              {
                name: 'Exact Activity Name',
                value: activityRole.exactActivityName ? 'Yes' : 'No',
                inline: true
              },
              { name: 'Live', value: activityRole.live ? 'Yes' : 'No', inline: true }
            )
            .setColor(config.botColor);
        })
      );
      interaction.reply({ content: 'Deleted Activity Roles:', embeds: embeds, ephemeral: true });
      deleted.forEach(activityRole => {
        log.info(
          `Activity role removed: in guild ${interaction.guild?.name} (${interaction.guildId}) role: ${activityRole.roleID} activityName: ${activityRole.activityName}, exactActivityName: ${activityRole.exactActivityName}, live mode: ${activityRole.live}`
        );
      });
    } else {
      interaction.reply({ content: 'No activity roles were deleted.', ephemeral: true });
    }
  }
} as Command;
