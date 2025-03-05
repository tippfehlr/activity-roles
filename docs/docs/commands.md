# `/activitystats`

## Description
Shows the server Actitivity Stats. (a better description? just adding some kind of placeholder)

## Command
`/activitystats`
___
# `/addactivityrole`

## Description
Adds a new activity role to the server. (a better description? just adding some kind of placeholder)

## Command
`/addactivityrole <activity> [<role> <exact_activity_name> <permanent> <remove_after_days>]`

## Arguments
### required
- `<activity>`: Represent what activity the bot should look for when assigning a role.
### optional
- `<role>`: If not provided, the bot will look for roles with the same name or create a new one.
- `<exact_activity_name>`: If false, the activity name 'Chrome' would also trigger for 'Google Chrome'.
- `<permanent>` - the role will not be removed again if set to true.

!!! bug

    the remove_after_days feature is currently not working. See the [GitHub issue](https://github.com/tippfehlr/activity-roles/issues/94) for more details.

- `<remove_after_days>`: remove roles again after x days with no activity. Only works with permanent = true.

___

# `/checkroles`

## Description
Verify users roles, then adds and remove bot's roles. (a better description? just adding some kind of placeholder)

## Command
`/checkroles`
