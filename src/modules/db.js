const Discord = require('discord.js');
const mongoose = require('mongoose');

const config = require('../config.js');
const messages = require('./messages.js');

async function connect() {
  await mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    messages.log.mongodbConnect();
  });
}

const UserConfig = require('./models/userConfig.js');
const GuildConfig = require('./models/guildConfig.js');
const GuildData = require('./models/guildData.js');
const UserData = require('./models/userData.js');


// @param guild: Discord guild object
async function checkGuild(guild) {
  messages.log.activity();
  if (!await GuildConfig.findById(guild.id.toString()).select('_id').lean()) {
    const channel = await guild.channels.create('game-roles-v2', { type: 'text' });
    channel.send(messages.newLogChannel());
    new GuildConfig({
      _id: guild.id.toString(),
      logChannelID: channel.id.toString()
    }).save();
    console.log(messages.addGuildLog());
  }
}

// @param user: Discord user object
async function checkUser(user) {
  messages.log.activity();
  if (!await UserConfig.findById(user.id.toString()).exec()) {
    await new UserConfig({
      _id: user.id.toString(),
      autoRole: true
    }).save();
    messages.log.addUser();
  }
}

// @param member: Discord member object
async function checkRoles(member) {
  messages.log.activity();
  if (member.user.bot) return;
  await checkUser(member.user);
  await checkGuild(member.guild);
  const doc = await UserConfig.findById(member.user.id.toString());
  if (!doc.autoRole) return;

  const guildActivityList = await GuildData.find({ guildID: member.guild.id.toString() }).lean();
  const userActivityList = await UserData.find({ userID: member.user.id.toString() }).lean();
  const highestBotRole = member.guild.me.roles.highest.position;

  for (const x in guildActivityList) {
    // eslint-disable-next-line no-var
    var userShouldHaveRole = false;
    userActivities: {
      if (guildActivityList[x].only_included_allowed) {
        for (const y in userActivityList) {
          if (userActivityList[y].activityName.includes(guildActivityList[x].activityName)) {
            if (!userActivityList[y].ignored && userActivityList[y].autoRole) {
              userShouldHaveRole = true;
              break userActivities;
            }
          }
        }
      } else {
        const userActivityListFiltered = userActivityList.filter(elmt => elmt.activityName === guildActivityList[x].activityName);
        for (const y in userActivityListFiltered) {
          if (userActivityListFiltered[y]) {
            if (!userActivityListFiltered[y].ignored && userActivityListFiltered[y].autoRole) {
              userShouldHaveRole = true;
              break userActivities;
            }
          }
        }
      }
    }
    const userHasRole = member.roles.cache.has(guildActivityList[x].roleID);
    const role = member.guild.roles.cache.find(_role => _role.id === guildActivityList[x].roleID);
    if (userShouldHaveRole && !userHasRole) { // add role to member
      if (role.position < highestBotRole) {
        member.roles.add(role);
        messages.log.addedRoleToMember(role.name, guildActivityList[x].roleID, member.user.username, member.user.id, member.guild.name, member.guild.id);
      } else if ('logChannelID' in await GuildConfig.findById(member.guild.id.toString()).lean()) {
        const _guildConfig = await GuildConfig.findById(member.guild.id.toString()).lean();
        const logChannelID = _guildConfig.logChannelID;
        const channel = member.guild.channels.cache.find(_channel => _channel.id === logChannelID);
        if (channel) {
          messages.log.errorCantAssignRole(role.id, role.position, member.user.id, guildActivityList[x].activityName, highestBotRole);
          channel.send(messages.errorCantAssignRole(role.id, role.position, member.user.id, guildActivityList[x].activityName, highestBotRole));
        }
      }
    } else if (!userShouldHaveRole && userHasRole) { // remove role from member
      if (role.position < highestBotRole) {
        member.roles.remove(role);
        messages.log.removedRoleFromMember(role.name, guildActivityList[x].roleID, member.user.username, member.user.id, member.guild.name, member.guild.id);
      } else if ('logChannelID' in await GuildConfig.findById(member.guild.id.toString()).lean()) {
        const _guildConfig = await GuildConfig.findById(member.guild.id.toString()).lean();
        const logChannelID = _guildConfig.logChannelID;
        const channel = member.guild.channels.cache.find(_channel => _channel.id === logChannelID);
        if (channel) {
          channel.send(messages.errorCantRemoveRole(role.id, role.position, member.user.id, guildActivityList[x].activityName, highestBotRole));
        }
      }
    }
  }
}

async function checkAllRoles(guild) {
  messages.log.activity();
  await checkGuild(guild);

  const guildActivityList = await GuildData.find({ guildID: guild.id.toString() }).lean();
  const highestBotRole = guild.me.roles.highest.position;

  await guild.members.cache.forEach(async (member) => { // for each member in guild
    user: {
      if (member.user.bot) break user;
      await checkUser(member.user);

      const doc = await UserConfig.findById(member.user.id.toString());
      if (!doc.autoRole) break user;

      const userActivityList = await UserData.find({ userID: member.user.id.toString() }).lean();

      for (const x in guildActivityList) {
        // eslint-disable-next-line no-var
        var userShouldHaveRole = false;
        userActivities: {
          if (guildActivityList[x].only_included_allowed) {
            for (const y in userActivityList) {
              if (userActivityList[y].activityName.includes(guildActivityList[x].activityName)) {
                if (!userActivityList[y].ignored && userActivityList[y].autoRole) {
                  userShouldHaveRole = true;
                  break userActivities;
                }
              }
            }
          } else {
            const userActivityListFiltered = userActivityList.filter(elmt => elmt.activityName === guildActivityList[x].activityName);
            for (const y in userActivityListFiltered) {
              if (userActivityListFiltered[y]) {
                if (!userActivityListFiltered[y].ignored && userActivityListFiltered[y].autoRole) {
                  userShouldHaveRole = true;
                  break userActivities;
                }
              }
            }
          }
        }
        const userHasRole = member.roles.cache.has(guildActivityList[x].roleID);
        const role = member.guild.roles.cache.find(_role => _role.id === guildActivityList[x].roleID);
        if (userShouldHaveRole && !userHasRole) { // add role to member
          if (role.position < highestBotRole) {
            member.roles.add(role);
            messages.log.addedRoleToMember(role.name, guildActivityList[x].roleID, member.user.username, member.user.id, member.guild.name, member.guild.id);
          } else if ('logChannelID' in await GuildConfig.findById(member.guild.id.toString()).lean()) {
            const _guildConfig = await GuildConfig.findById(member.guild.id.toString()).lean();
            const logChannelID = _guildConfig.logChannelID;
            const channel = member.guild.channels.cache.find(_channel => _channel.id === logChannelID);
            if (channel) {
              messages.log.errorCantAssignRole(role.id, role.position, member.user.id, guildActivityList[x].activityName, highestBotRole);
              channel.send(messages.errorCantAssignRole(role.id, role.position, member.user.id, guildActivityList[x].activityName, highestBotRole));
            }
          }
        } else if (!userShouldHaveRole && userHasRole) { // remove role from member
          if (role.position < highestBotRole) {
            member.roles.remove(role);
            messages.log.removedRoleFromMember(role.name, guildActivityList[x].roleID, member.user.username, member.user.id, member.guild.name, member.guild.id);
          } else if ('logChannelID' in await GuildConfig.findById(member.guild.id.toString()).lean()) {
            const _guildConfig = await GuildConfig.findById(member.guild.id.toString()).lean();
            const logChannelID = _guildConfig.logChannelID;
            const channel = member.guild.channels.cache.find(_channel => _channel.id === logChannelID);
            if (channel) {
              channel.send(messages.errorCantRemoveRole(role.id, role.position, member.user.id, guildActivityList[x].activityName, highestBotRole));
            }
          }
        }
      }
    }
  });
}

module.exports = {
  connect,
  checkGuild,
  checkUser,
  checkRoles,
  checkAllRoles,

  UserConfig,
  GuildConfig,
  GuildData,
  UserData
};


// // @param userID: Discord ID of User
// // @param autoRole: default = true
// async function addToUserConfig(userID, autoRole = true) {
//   new UserConfig({
//     _id: userID,
//     autoRole: autoRole
//   }).save();
// }

// // @param userID: Discord ID of User
// // @param autoRole: default = true
// async function addUserConfigSync(userID, autoRole = true) {
//   await new UserConfig({
//     _id: userID,
//     autoRole: autoRole
//   }).save();
// }

// // @param guildID: Discord ID of Guild
// async function addGuildConfig(guildID) {
//   new GuildConfig({
//     _id: guildID
//   }).save();
// }

// // @param guildID: Discord ID of Guild
// async function addGuildConfigSync(guildID) {
//   await new GuildConfig({
//     _id: guildID
//   }).save();
// }

// // @param guildID: Discord ID of Guild
// // @param roleID: Discord ID of Role to give to users
// // @param activityName: Name of the activity of users to which give the role
// // @param only_included_allowed: If activityName of users has to fully match activityName
// async function addGuildData(guildID, roleID, activityName, only_included_allowed = false) {
//   new GuildData({
//     guildID: guildID,
//     roleID: roleID,
//     activityName: activityName,
//     only_included_allowed: only_included_allowed
//   }).save();
// }

// // @param guildID: Discord ID of Guild
// // @param roleID: Discord ID of Role to give to users
// // @param activityName: Name of the activity of users to which give the role
// // @param only_included_allowed: If activityName of users has to fully match activityName
// async function addGuildDataSync(guildID, roleID, activityName, only_included_allowed = false) {
//   await new GuildData({
//     guildID: guildID,
//     roleID: roleID,
//     activityName: activityName,
//     only_included_allowed: only_included_allowed
//   }).save();
// }

// // @param userID: Discord ID of user
// // @param activityName: String name of activity
// // @param autoRole: if roles should be assigned automatically
// // @param ignored: if the activity should be ignored
// async function addUserData(userID, activityName, autoRole, ignored) {
//   new GuildData({
//     userID: userID,
//     activityName: activityName,
//     autoRole: autoRole,
//     ignored: ignored
//   }).save();
// }

// // @param userID: Discord ID of user
// // @param activityName: String name of activity
// // @param autoRole: if roles should be assigned automatically
// // @param ignored: if the activity should be ignored
// async function addUserDataSync(userID, activityName, autoRole, ignored) {
//   await new GuildData({
//     userID: userID,
//     activityName: activityName,
//     autoRole: autoRole,
//     ignored: ignored
//   }).save();
// }

// module.exports = {
//   addUserConfig,
//   addUserConfigSync,
//   addGuildConfig,
//   addGuildConfigSync,
//   addGuildData,
//   addGuildDataSync,
//   addUserData,
//   addUserDataSync
// }


/// / function checkGuild(guild) { // checks for and adds the guild to the database
/// /    if (typeof db.prepare("SELECT * FROM guildData WHERE guildID=?").get(guild.id.toString()) == "undefined") {
/// /         db.prepare("INSERT INTO guildData (guildID) VALUES (?)").run(guild.id.toString());
/// /         console.log(`SQLITE > Added guild ${guild.name} (${guild.id}) to the database.`);
/// /     }
/// / }

/// / function checkUser(user) { // checks for and adds the user to the database
/// /     if (typeof db.prepare("SELECT * FROM userData WHERE userID=?").get(user.id.toString()) == "undefined") {
/// /         db.prepare("INSERT INTO userData (userID, autoRole) VALUES (?, 1)").run(user.id.toString());
/// /         console.log(`SQLITE > Added user ${user.username} (${user.id}) to the database.`);
/// /     }
/// / }

// function checkRoles(member) {
//     if (member.user.bot) return;
//     checkUser(member.user);
//     checkGuild(member.guild);
//     const userAutoRole = Boolean(db.prepare("SELECT autoRole FROM userData WHERE userID=?").get(member.id.toString()).autoRole);
//     if (!userAutoRole) return;

//     const activityList = db.prepare("SELECT activityName, roleID FROM guilds WHERE guildID=?").all(member.guild.id.toString());

//     i = 0;
//     while (i < activityList.length) {
//         let userPlaysGame = db.prepare("SELECT autoRole FROM users WHERE activity=? AND userID=?").get(activityList[i].activityName, member.id.toString());
//         if (typeof userPlaysGame !== "undefined") {

//             if (!member.roles.cache.has(activityList[i].roleID.toString()) && Boolean(userPlaysGame.autoRole)) {
//                 const role = member.guild.roles.cache.find(role => role.id === activityList[i].roleID.toString());
//                 member.roles.add(role);
//                 console.log(`DISCORD.JS > added Role ${role.name} (${activityList[i].roleID.toString()}) to user: ${member.user.username} (${member.user.id}) on guild: ${member.guild.name} (${member.guild.id})`)
//             }
//         } else if (!userPlaysGame && member.roles.cache.has(activityList[i].roleID.toString())) {
//             const role = member.guild.roles.cache.find(role => role.id === activityList[i].roleID.toString());
//             member.roles.remove(role);
//             console.log(`DISCORD.JS > deleted Role ${role.name} (${activityList[i].roleID.toString()}) from user: ${member.user.username} (${member.user.id}) on guild: ${member.guild.name} (${member.guild.id})`)
//         }
//         i++;
//     }

// }

// function checkAllRoles(guild) {
//     checkGuild(guild);
//     const activityList = db.prepare("SELECT activityName, roleID FROM guilds WHERE guildID=?").all(guild.id.toString());

//     guild.members.cache.forEach((member) => {
//         if (member.user.bot) return;
//         checkUser(member.user);
//         const userAutoRole = Boolean(db.prepare("SELECT autoRole FROM userData WHERE userID=?").get(member.id.toString()).autoRole);
//         if (userAutoRole) {
//             i = 0;
//             while (i < activityList.length) {
//                 let userPlaysGame = db.prepare("SELECT autoRole FROM users WHERE activity=? AND userID=?").get(activityList[i].activityName, member.id.toString());

//                 if (typeof userPlaysGame !== "undefined") {
//                     if (!member.roles.cache.has(activityList[i].roleID.toString()) && userPlaysGame.autoRole) {
//                         const role = member.guild.roles.cache.find(role => role.id === activityList[i].roleID.toString());
//                         member.roles.add(role);
//                         console.log(`DISCORD.JS > added Role ${role.name} (${activityList[i].roleID.toString()}) to user: ${member.user.username} (${member.user.id}) on guild: ${member.guild.name} (${member.guild.id})`)
//                     }
//                 } else if (!userPlaysGame && member.roles.cache.has(activityList[i].roleID.toString())) {
//                     const role = member.guild.roles.cache.find(role => role.id === activityList[i].roleID.toString());
//                     member.roles.remove(role);
//                     console.log(`DISCORD.JS > deleted Role ${role.name} (${activityList[i].roleID.toString()}) from user: ${member.user.username} (${member.user.id}) on guild: ${member.guild.name} (${member.guild.id})`)
//                 }
//                 i++;
//             }
//         }
//     });
// }


// module.exports = { db, checkGuild, checkUser, checkRoles, checkAllRoles };