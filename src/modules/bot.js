const Discord = require('discord.js');
const WOKcommands = require('wokcommands');

const client = new Discord.Client();
const db = require('./db.js');

const config = require('../config.js');
const { presence } = config;
const testGuildIDs = ['782687651492790314', '727818725784551495'];

function changeActivity() {
  if (presence.nextActivityNumber >= presence.activity.length) {
    presence.nextActivityNumber = 0;
  }
  client.user.setPresence({
    status: 'online',
    activity: {
      name: presence.activity[presence.nextActivityNumber],
      type: presence.activityType[presence.nextActivityNumber]
    }
  });
  presence.nextActivityNumber++;
}


client.once('ready', () => {
  new WOKcommands(client, {
    commandsDir: 'commands',
    // featuresDir: '../features',
    testServers: testGuildIDs,
    showWarns: false
  }).setBotOwner(config.botOwner)
    .setDisplayName('Game Roles V2')
    .setMongoPath(config.MONGODB_URI);

  if (presence.activity.length > 0) {
    changeActivity();
    setInterval(changeActivity, 15 * 1000);
  }

  console.log('DISCORD.JS > Ready!');
});

client.on('presenceUpdate', async function(oldMember, newMember) {
  if (newMember.member.user.bot) return;
  await db.checkGuild(newMember.guild);
  await db.checkUser(newMember.user);

  for (const i in newMember.activities) {
    if (newMember.activities[i].name !== 'Custom Status') {
      db.UserData.findOne({ userID: newMember.user.id.toString(), activityName: newMember.activities[i].name }, (err, docs) => {
        if (err) console.error(err);
        if (!docs) {
          new db.UserData({
            userID: newMember.user.id.toString(),
            activityName: newMember.activities[i].name,
            autoRole: true,
            ignored: false
          }).save();
          console.log(`\nMONGODB > New activity: ${newMember.user.username} (${newMember.user.id}) plays ${newMember.activities[i].name}.`);
        }
      }).lean();
    }
  }
  db.checkRoles(newMember.member);
});

client.on('guildCreate', function(guild) {
  console.log(`\nDISCORD.JS > the client joined ${guild.name}`);
  db.checkGuild(guild);
});

client.on('guildDelete', function(guild) {
  console.log(`\nthe client left ${guild.name}`);
});

client.on('disconnect', function(event) {
  console.log('\nDISCORD.JS > The WebSocket has closed and will no longer attempt to reconnect');
});

client.on('error', function(error) {
  console.error(`\nDISCORD.JS > The client's WebSocket encountered a connection error: ${error}`);
});

function connect() {
  client.login(config.TOKEN);
}

module.exports = { connect, client };