const Discord = require("discord.js");
const config = require("../config.js");

//TODO: Update help after ./command transfer

module.exports = {
  default: "Sorry, not added yet",
  autoRole: new Discord.MessageEmbed()
    .setColor(config.embedColor)
    .setTitle(`Help with /autoRole`)
    .addField("Usage:", "`" + `/autoRole <true/false> <optional: game>` + "`")
    .addField("<true/false>", "Decides if the bot does assign you roles automatically")
    .addField("<optional: game>", "Sets the autoRole only for a specific game, useful if you play games for which you don't want to have roles. \nIt has to be exactly exact as its the only way for me to check it")
    .setTimestamp()
    .setFooter("© 2021 tippfehlr#3575", config.botOwnerLogoLink),
  inviteLink: new Discord.MessageEmbed()
    .setDescription(`Here is my Link: ${config.inviteLink}.\nThanks for inviting me!`)
    .setColor(config.embedColor),
};
