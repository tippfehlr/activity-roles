const Discord = require("discord.js");
const config = require("../config.js");
const db = require('../modules/db.js');
const messages = require('../modules/messages.js')

module.exports = {
  name: 'setLogChannel',
  // aliases: ['p'],
  slash: true,
  testOnly: true,
  description: 'Define a log channel.',
  category: 'Configuration',
  expectedArgs: '[channel]',
  minArgs: 0,
  maxArgs: 1,
  // syntaxError: 'Incorrect syntax! Use `{PREFIX}`ping {ARGUMENTS}',
  permissions: ['MANAGE_ROLES'],
  // cooldown: '60s',
  // globalCooldown: '10m',
  // hidden: false,
  // ownerOnly: false,
  guildOnly: true,
  callback: ({ message, channel, args, text, client, prefix, instance, interaction }) => {
    messages.log.activity();
    if (args[0]) {
      //TODO
      return 'OK';
    } else {
      db.GuildConfig.updateOne({_id: channel.guild.id.toString()}, { logChannelID: channel.id.toString() });
      return messages.newLogChannel();
    }
  },
};