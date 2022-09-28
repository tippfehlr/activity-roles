import { ColorResolvable, ActivityOptions } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.TOKEN as string;

export default {
  /* -------------------- change these to self-host the bot ------------------- */
  // also put your bot token into .env
  botOwners: ['000000000000000000'], // your id here
  inviteLink:
    'https://discord.com/api/oauth2/authorize?client_id=000000000000000000&permissions=8&scope=bot%20applications.commands', //bot user id here (at ?client_id=)
  host: '', // your discord tag here

  /* ----------------------- change these to your liking ---------------------- */
  botColor: '#3695d3' as ColorResolvable, // the color of most embeds and roles created by the bot
  activities: [
    { name: '/help', type: 'LISTENING' } as ActivityOptions,
    { name: 'you', type: 'WATCHING' } as ActivityOptions
  ],
  listRolesFileName: 'activityRolesList.txt', // the name of the file that gets send on /listroles
  exportFileName: 'export.json', // the name of the file that gets send on /export

  /* ------------ change when live roles are not assigned properly ------------ */
  // if enabled, will call checkAllRoles() on all guilds that have activity or live roles at the interval specified below. Used to assign roles even when presenceUpdate isn't called.
  guildCheckInterval: {
    enabled: true,
    interval: 1000 * 30,
    onlyWithLiveRole: true
  },

  /* -------------------------------- DEBUGGING ------------------------------- */
  debug: false, // if a guild id is in the array, the command will be registered as guild only

  /* ------------------ don't change anything below (please) ------------------ */
  supportGuildLink: 'https://discord.gg/3K9Yx4ufN7', // link to support guild
  botAuthorLogoLink: 'https://drive.google.com/uc?id=1c-jP8Znqm72U2kEhoOdP-DzFvpiyJnvd', // link to my profile picture
  author: 'tippfehlr#3575',

  TOKEN
};
