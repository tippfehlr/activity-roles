import Discord, { ColorResolvable } from "discord.js";
import config from "../../config";

//TODO: Update help

export default {
  default: "Sorry, not added yet",
  autoRole: new Discord.MessageEmbed()
    .setColor(config.embedColor as ColorResolvable)
    .setTitle(`Help with /autoRole`)
    .addField("Usage:", "`" + `/autoRole <true/false> <optional: game>` + "`")
    .addField("<true/false>", "Decides if the bot does assign you roles automatically")
    .addField("<optional: game>", "Sets the autoRole only for a specific game, useful if you play games for which you don't want to have roles. \nIt has to be exactly exact as its the only way for me to check it")
    .setTimestamp()
    .setFooter("© 2021 tippfehlr#3575", config.botOwnerLogoLink),
  inviteLink: new Discord.MessageEmbed()
    .setDescription(`Here is my Link: ${config.inviteLink}.\nThanks for inviting me!`)
    .setColor(config.embedColor as ColorResolvable),
  jest: 'jest1234'
}
