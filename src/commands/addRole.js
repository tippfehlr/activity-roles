const Discord = require('discord.js');
const config = require('../config.js');
const db = require('../modules/db.js');
const messages = require('../modules/messages.js')

module.exports = {
  name: 'addrole',
  // aliases: ['p'],
  slash: true,
  testOnly: true,
  description: 'Add a GameRole to your guild!',
  category: 'Configuration',
  expectedArgs: '<role> <activity> [included]',
  minArgs: 2,
  maxArgs: 3,
  // syntaxError: 'Incorrect syntax! Use `{PREFIX}`ping {ARGUMENTS}',
  permissions: ['MANAGE_ROLES'],
  // cooldown: '60s',
  // globalCooldown: '10m',
  // hidden: false,
  // ownerOnly: false,
  // guildOnly: false,
  callback: async ({ message, channel, args, text, client, prefix, instance, interaction }) => {
    messages.log.activity();

    const roleID = args[0].replace(/[\\<>@#&!]/g, '');
    const activityName = args[1];
    let only_included_allowed;
    switch (args[2]) {
    case 'yes':
      only_included_allowed = true;
      break;
    case 'no':
      only_included_allowed = false;
      break;
    case 'true':
      only_included_allowed = true;
      break;
    case 'false':
      only_included_allowed = false;
      break;
    case '1':
      only_included_allowed = true;
      break;
    case '0':
      only_included_allowed = false;
      break;
    default:
      return ':x: wrong value for `ignored`. :x:';
      break; //TODO?
    }

    const role = channel.guild.roles.cache.get(roleID);
    if (!role) {
      return ':x: That role does not exist! :x:';
    } else {
      if (await db.GuildData.findOne({ guildID: channel.guild.id.toString(), roleID: roleID, activityName: activityName })) {
        return ':x: That GameRole already exists in this guild! Edit it with `/editRole`. :x:';
      } else {
        new db.GuildData({
          guildID: channel.guild.id.toString(),
          roleID: roleID,
          activityName: activityName,
          only_included_allowed: only_included_allowed
        }).save();

        console.log(`\nMONGODB > New game role added: on guild ${channel.guild.name} (${channel.guild.id}) role: ${role.name} (${roleID}) activityName: ${activityName}, included: ${only_included_allowed}`);

        return new Discord.MessageEmbed()
          .setColor(config.embedColor)
          .setTitle('Set!')
          .addField('Role:', role)
          .addField('Activity:', activityName)
          .addField('Included:', only_included_allowed);
      }
    }
    db.checkAllRoles(message.guild);
  }
};