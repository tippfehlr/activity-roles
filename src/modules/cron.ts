import { checkGuilds } from './cron/checkRoles';
import { executeScheduledRoleActions } from './cron/scheduledRoleActions';
import { updateMemberCount } from './cron/updateMemberCount';

export function cron() {
  // checkroles:
  // execute every 30 minutes
  // check if the last check was more than 20 hours ago
  checkGuilds();
  setInterval(checkGuilds, 30 * 60 * 1000);

  // membercount:
  // execute every 24 hours
  // check if the last update was more than 7 days ago
  updateMemberCount();
  setInterval(updateMemberCount, 24 * 60 * 60 * 1000);

  // scheduled role actions:
  // execute every 6 hours
  // check for roles to add or remove in scheduledRoleActions
  executeScheduledRoleActions();
  setInterval(executeScheduledRoleActions, 6 * 60 * 60 * 1000);
}
