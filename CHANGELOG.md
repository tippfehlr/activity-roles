# Changelog

## [1.13.0](https://github.com/tippfehlr/activity-roles/compare/v1.12.5..v1.13.0) - 2024-08-23

### Features

- upload commands at application start ([844c3b9](https://github.com/tippfehlr/activity-roles/commit/844c3b942b213fd5e47579bd98ba135d8845101b))
- ask for MANAGE_ROLES permission on /checkRoles ([bccfcaa](https://github.com/tippfehlr/activity-roles/commit/bccfcaab2157693314a19ffc9625a765187da03e))
- display error message when role is below highest bot role in /checkroles ([cdca320](https://github.com/tippfehlr/activity-roles/commit/cdca32005c828cc870f41bcdeb0072387d1c3469))

### Bug Fixes

- **(approxMemberCount)** update guilds with null ([4cf26ec](https://github.com/tippfehlr/activity-roles/commit/4cf26ec879bae75ad8370eb1e5d983543cce21a0))
- typo ([375824b](https://github.com/tippfehlr/activity-roles/commit/375824b102d065cdff95f38f41e02efc671662ad))
- typo in pnpm run temp-db ([32c4346](https://github.com/tippfehlr/activity-roles/commit/32c4346d30f96d1d370914207d7bb2e27801ecac))
- workaround for (p)npm invoking SIGINT twice on ^C ([bf384fe](https://github.com/tippfehlr/activity-roles/commit/bf384feb30e19539ec1ade42bc0ea7274183731e))
- use presenceUpdate->roleHigherThanBotrole in /addActivityRole ([35e9101](https://github.com/tippfehlr/activity-roles/commit/35e910102b9340acd75d69130e411b69521d27c7))
- release.fish ([f109c0b](https://github.com/tippfehlr/activity-roles/commit/f109c0b43783c8e8e608653426ae84c3d61150a6))

## [1.12.5](https://github.com/tippfehlr/activity-roles/compare/v1.12.4..v1.12.5) - 2024-06-27

### Features

- add column approxMemberCount to guilds ([21bd8b3](https://github.com/tippfehlr/activity-roles/commit/21bd8b3c0ac9a7ef44bf299bf7739b5a42147c45))

## [1.12.4](https://github.com/tippfehlr/activity-roles/compare/v1.12.3..v1.12.4) - 2024-06-24

### Bug Fixes

- **(presenceUpdate)** abort early when user is a bot ([ed80bef](https://github.com/tippfehlr/activity-roles/commit/ed80befdb661326d30d481e1fb2b47f466104aba))

## [1.12.3](https://github.com/tippfehlr/activity-roles/compare/v1.12.2..v1.12.3) - 2024-05-01

### Bug Fixes

- **(/checkroles)** check for autorole and requiredRole ([8007214](https://github.com/tippfehlr/activity-roles/commit/800721445b588e16c2dba997aef7cf7faa9a27db))
- **(syncCommands)** use process.exit() instead of close() in bot.ts ([2c71d82](https://github.com/tippfehlr/activity-roles/commit/2c71d82ac7479c360ea9e9e3b7338bb7e9e325ba))

### Translation

- **(i18n)** pull French ([d67ebc4](https://github.com/tippfehlr/activity-roles/commit/d67ebc4affc48a76a44e58163a9f0faa0e0bb3aa))
- **(i18n)** pull German translation ([1ddfc4c](https://github.com/tippfehlr/activity-roles/commit/1ddfc4cac3aa82e92b16f616961e7b7c4987d7e0))

### Documentation

- **(README)** remove newline after badges ([ead3bc2](https://github.com/tippfehlr/activity-roles/commit/ead3bc2c96e39693bdc9b2f286e522e1c2e9235a))

## [1.12.2](https://github.com/tippfehlr/activity-roles/compare/v1.12.1..v1.12.2) - 2024-04-26

### Bug Fixes

- **(deleteActivityRole)** send table like /listRoles instead of embeds ([03b12a2](https://github.com/tippfehlr/activity-roles/commit/03b12a257d7d040c0888137c37247401e7674cbf))
- disable /deleteActivityRole and /setStatusRole in DMs ([9b08642](https://github.com/tippfehlr/activity-roles/commit/9b08642042a85d37a1ac9b8ab692c1bb40f94a29))
- don’t add roles to bots on /checkroles ([6a1fb9e](https://github.com/tippfehlr/activity-roles/commit/6a1fb9e13b500019a22642f6dd015a37edc1019a))
- add strings for addActivityRole/deleteActivityRole ([dbb61a6](https://github.com/tippfehlr/activity-roles/commit/dbb61a6f294f7ee87028b085b38d1d0dc4c2ec43))

### Translation

- **(i18n)** pull translations ([7c383a3](https://github.com/tippfehlr/activity-roles/commit/7c383a332ffe2f0e51a82e958a876ed2043739ef))

## [1.12.1](https://github.com/tippfehlr/activity-roles/compare/v1.12.0..v1.12.1) - 2024-04-24

### Features

- add automated checkRoles ([042c780](https://github.com/tippfehlr/activity-roles/commit/042c780a878db73a4e3da9ad038297837fd604dc))

### Bug Fixes

- update status every 2 seconds, not 20 ms ([8d5c6d8](https://github.com/tippfehlr/activity-roles/commit/8d5c6d8710a3ebed64b4b7a1730b7088f6a3e0db))
- exit on error "driver has already been destroyed" ([c9173bd](https://github.com/tippfehlr/activity-roles/commit/c9173bd8e7ed6978fb6cfadb666e2991683ebbb1))
- fix /deleteActivityRole <role>, roleID != guildID ([fa24c8f](https://github.com/tippfehlr/activity-roles/commit/fa24c8fbd92297e41965f2ff9b76010390660f60))
- assign multiple roles ([648625f](https://github.com/tippfehlr/activity-roles/commit/648625fc594d53cc5e9d6d5c9872441ac100cfa3))
- fix broken /deleteActivityRole all:true buttons ([ae18ab7](https://github.com/tippfehlr/activity-roles/commit/ae18ab72e2f45824872d514374bf9bb4a197c582))

### Translation

- **(i18n)** pull French tranlation ([16c4c2f](https://github.com/tippfehlr/activity-roles/commit/16c4c2f0152ec43a1ba620238b295ce6cc17f08e))
- **(i18n)** add phrases for /deleteActivityRole ([c88ab4b](https://github.com/tippfehlr/activity-roles/commit/c88ab4baf08c6f9f980abe520804c0411f254447))

### Documentation

- **(README)** add @kedone to thanks ([67559f2](https://github.com/tippfehlr/activity-roles/commit/67559f20f07d3d76ce5f440003f5a2f41c33a643))

## [1.12.0](https://github.com/tippfehlr/activity-roles/compare/v1.11.0..v1.12.0) - 2024-04-20

### Features

- implement /checkroles ([f988234](https://github.com/tippfehlr/activity-roles/commit/f9882346a603f0fcd1705917ae43479515606b2e))

### Bug Fixes

- don’t use ...role to fill values ([b9bf6ad](https://github.com/tippfehlr/activity-roles/commit/b9bf6ad8cb0f330d4f52efd91a6d2d938ff49510))
- convert count(*) result to number ([a6e9399](https://github.com/tippfehlr/activity-roles/commit/a6e9399f50dbbe83c0e3c199ac690a8f77394abe))
- set maximum length for activity names to 100 characters ([bfa3f2e](https://github.com/tippfehlr/activity-roles/commit/bfa3f2edb4aaa8a8653229b0cb8a5eba33fbebb5))

## [1.11.0](https://github.com/tippfehlr/activity-roles/compare/v1.10.2..v1.11.0) - 2024-04-13

### Features

- **(metrics)** add metrics for {old,new} users and activeTemporaryRoles ([3742d56](https://github.com/tippfehlr/activity-roles/commit/3742d569caa01bcd41e331dfc3aec31978802cd2))
- **(metrics)** add metric for locales ([9bdb0dd](https://github.com/tippfehlr/activity-roles/commit/9bdb0dd0c66e0eb74aba28eb064c672cdc33bdd3))
- automatically migrate database from sqlite ([8b22ea3](https://github.com/tippfehlr/activity-roles/commit/8b22ea382344508ea27b8afdf2d8992773a075a4))
- explicitely connect to postgres and exit if no connection ([952424c](https://github.com/tippfehlr/activity-roles/commit/952424c96f0f71507432249ab6bd2a83919cdc6f))

### Bug Fixes

- **(/help)** 'the bot will be removed' -> 'the bot will remove the role' ([a243b31](https://github.com/tippfehlr/activity-roles/commit/a243b3198d12d6aef77b31ed24231021c8fd206b))
- **(presenceUpdate)** add onConflict to insert into activeTemporaryRoles ([95a1e5c](https://github.com/tippfehlr/activity-roles/commit/95a1e5ca3651769ab1816aaee18ba13910442f1b))
- reverse logic for /requirerole ([ba61603](https://github.com/tippfehlr/activity-roles/commit/ba616031727a6ea433ddbd5d925882375d778250))

### Translation

- **(i18n)** remove strings used in /language from locales ([acff925](https://github.com/tippfehlr/activity-roles/commit/acff925ad3a096155e4fce43e76f3519ffc137a6))
- **(i18n)** pull changes from crowdin ([db1d84f](https://github.com/tippfehlr/activity-roles/commit/db1d84fb7f113d379a514552997a7d07d448ec98))

### Documentation

- **(readme)** remove privacy notice about hashes user IDs. ([653f774](https://github.com/tippfehlr/activity-roles/commit/653f7749aa3859244d74669fb34fd57f178a55c0))
- **(readme)** remove the _new_ notice for /statusrole ([2f304f7](https://github.com/tippfehlr/activity-roles/commit/2f304f7b8a92199b4d7fb20ccfb5b391708d125c))

## [1.10.2](https://github.com/tippfehlr/activity-roles/compare/v1.10.1..v1.10.2) - 2024-04-10

### Features

- add username to logs for not adding/removing logs ([efbcef0](https://github.com/tippfehlr/activity-roles/commit/efbcef0cd9e3026b32a0500c8224d47180a5048c))

### Bug Fixes

- use `locales.includes()` instead of `... in locales` ([35a5ee6](https://github.com/tippfehlr/activity-roles/commit/35a5ee644ffcf3adf505ffe9f3e7ec8cb1f0f974))
- remove language completely ([0ad6d81](https://github.com/tippfehlr/activity-roles/commit/0ad6d81c7be3176d22699a9677e1518f5dca5b5f))

### Documentation

- **(changelog)** remove line between versions ([1af3bf8](https://github.com/tippfehlr/activity-roles/commit/1af3bf88ed71a43d7761c36f4b9c165591ff17aa))

## [1.10.0](https://github.com/tippfehlr/activity-roles/compare/v1.9.5..v1.10.0) - 2024-04-08

### Features

- **(metrics)** add temporary/permanent/status roles count individually ([84fdc79](https://github.com/tippfehlr/activity-roles/commit/84fdc797c8c349840432989194166fcddcfb78ca))
- **(metrics)** make influxdb organization and bucket customizable via env vars ([b300183](https://github.com/tippfehlr/activity-roles/commit/b300183d1ed656f2df92f741a899d9c349d258e4))
- **(metrics)** add metrics for added temporary/permanent roles ([59160f5](https://github.com/tippfehlr/activity-roles/commit/59160f510d5c3f24828b9110ab2ac0074beddabf))
- infer log level from env variable LOG_LEVEL, default to 'info' ([b536ded](https://github.com/tippfehlr/activity-roles/commit/b536ded4b470ddad8c60e837ec41329f4e40271a))
- logs/metrics for presence_update execution time ([dad307c](https://github.com/tippfehlr/activity-roles/commit/dad307c2d1f5620e98c59abf9096582df7792eb3))
- change runtime from node.js to bun ([3ed438d](https://github.com/tippfehlr/activity-roles/commit/3ed438da724c9772a611787eecfc41b288bfb44b))
- add /checkroles ([1dbaa56](https://github.com/tippfehlr/activity-roles/commit/1dbaa56e6ef6046bb4d312099371d195f43d4b9d))
- gracefully exit by listening for SIG{TERM,INT} ([cb7d703](https://github.com/tippfehlr/activity-roles/commit/cb7d703141d840e595b83c71b1bf1ce219f49479))
- add French ([53f7dd7](https://github.com/tippfehlr/activity-roles/commit/53f7dd7afc61197de67594d660280910343b1018))

### Bug Fixes

- **(perf)** don’t enable shards: 'auto': broke the whole bot ([2192919](https://github.com/tippfehlr/activity-roles/commit/2192919d048955a77748cada1df4777d1a51f603))
- **(presenceUpdate)** don’t fetch() members ([0ded481](https://github.com/tippfehlr/activity-roles/commit/0ded48156fc5f4ffed5a5f7ec07d1c842131414c))
- leave guilds without permission ([fe11ac4](https://github.com/tippfehlr/activity-roles/commit/fe11ac419b8d2cc81eae09e82b0e07eeaec6bc85))
- disable cache sweeping for now ([5e10a3b](https://github.com/tippfehlr/activity-roles/commit/5e10a3b0ef0c644d50cde295594c5321585b8293))
- check if bot’s highest role is higher than role when removing roles ([30944db](https://github.com/tippfehlr/activity-roles/commit/30944dbbe4c1bea8373335030acfcea0e8a8b839))

### Performance

- **(presence_update)** don’t check activities for offline members ([7aee88c](https://github.com/tippfehlr/activity-roles/commit/7aee88c6f6db4016eefbf4635f43a538c8ddf064))
- remove unneeded intents ([ad9312f](https://github.com/tippfehlr/activity-roles/commit/ad9312f5077032ed32e9ec48bd44e3bed072bcfb))
- cache limits and sweeper rules ([d3de1c9](https://github.com/tippfehlr/activity-roles/commit/d3de1c9597c8e3e653de923fff7d548fed24b9ac))
- adjust max cache settings ([ee42ad0](https://github.com/tippfehlr/activity-roles/commit/ee42ad0e8ae8762194dc7f24c9c42751f1206674))
- don’t limit cache, only sweep ([412ba9b](https://github.com/tippfehlr/activity-roles/commit/412ba9bfcb026804a73cc3461909b76628865c08))
- add shards: 'auto' ([1694a9a](https://github.com/tippfehlr/activity-roles/commit/1694a9aa23c5878651fabbce4ff6934ac32a117f))
- remove check if member has role when adding role ([de67928](https://github.com/tippfehlr/activity-roles/commit/de67928602975599c0a98e103f301dce8a951de4))
- remove debug timings in presenceUpdate ([c1523f7](https://github.com/tippfehlr/activity-roles/commit/c1523f77d31636b4182cfc86b6ceb011e1b0f105))
- fetching roles takes too long ([ff1036d](https://github.com/tippfehlr/activity-roles/commit/ff1036d69a43da253068b0ec54a718315d088fb5))

### Documentation

- **(fix)** edit docs url ([ecc07fb](https://github.com/tippfehlr/activity-roles/commit/ecc07fb27b21a8c33e0969da0613f242cae2bfce))
- add Material for MkDocs ([8092b7a](https://github.com/tippfehlr/activity-roles/commit/8092b7a585568e9aa982635100b059de5906e680))
- set github pages site ([8d3912d](https://github.com/tippfehlr/activity-roles/commit/8d3912d38567e5ebace82817a6f4bc8c5834c688))
- add arceus to thanks ([a97f360](https://github.com/tippfehlr/activity-roles/commit/a97f360b004a5dd8ff7ab3803675bc2d2b7f0be4))

## [1.9.5](https://github.com/tippfehlr/activity-roles/compare/v1.9.4..v1.9.5) - 2024-03-09

### Bug Fixes

- **(commands/help)** remove embed for commands ([fa4fd52](https://github.com/tippfehlr/activity-roles/commit/fa4fd524f0fd753b0194d11f9ef30fe5fdaea7ef))
- fix docker image in compose.yaml ([5dfaee8](https://github.com/tippfehlr/activity-roles/commit/5dfaee897810ccb1ec8a548fe7e2c205fe5eec8c))

## [1.9.4](https://github.com/tippfehlr/activity-roles/compare/v1.9.3..v1.9.4) - 2024-03-09

### Features

- **(i18n)** add Estonian (Thanks @itshendrik!) ([4f59614](https://github.com/tippfehlr/activity-roles/commit/4f596148bd94ed3bae60b5bddcaf2f136f36ba03))

### Bug Fixes

- **(readme)** fix eianlee’s name ([f52e74f](https://github.com/tippfehlr/activity-roles/commit/f52e74ffd5c06b1e271c13d5ef64b63c5f6143a9))

## [1.9.3](https://github.com/tippfehlr/activity-roles/compare/v1.9.2..v1.9.3) - 2024-03-09

### Features

- send metrics to influxdb ([1837135](https://github.com/tippfehlr/activity-roles/commit/1837135e02d88b9b160492b8bd78621978023a99))
- metrics for database access ([6992972](https://github.com/tippfehlr/activity-roles/commit/69929724d6014cee7cf4057663aa670a4038249f))
- send new metrics: memory and metric execution time ([8fff5ed](https://github.com/tippfehlr/activity-roles/commit/8fff5ede42b94f2bcdd10261b774081eb5c882b7))

### Bug Fixes

- **(readme)** remove > from invite link (text) ([206b23a](https://github.com/tippfehlr/activity-roles/commit/206b23a16e281c2b84e0446e81bfd3ee7dfc8eec))
- stats don’t reset ([1e58a46](https://github.com/tippfehlr/activity-roles/commit/1e58a46b240cf0d9467e54aaa70738c0d5658f0f))

### Documentation

- remove star notice ([70f81cd](https://github.com/tippfehlr/activity-roles/commit/70f81cd8342b6aac894b5dd75a3fb0c93a7d5733))
- rename compose file to compose.yaml, add new variables ([92381f9](https://github.com/tippfehlr/activity-roles/commit/92381f9a5f5b0c9b87530d564f2ae656dc105e11))

## [1.9.2](https://github.com/tippfehlr/activity-roles/compare/v1.9.1..v1.9.2) - 2024-01-06

### Bug Fixes

- **(commands/addactivityrole)** change description to match `permanent` ([d67a505](https://github.com/tippfehlr/activity-roles/commit/d67a505e48ae497f3e6a0eb3a658cf8c4dc5f055))
- set status roles to permanent=false ([5bfd2bd](https://github.com/tippfehlr/activity-roles/commit/5bfd2bdff952f1a660e6bfd3fac21d938420e70f))
- set the current dbversion in new databases ([0f6a907](https://github.com/tippfehlr/activity-roles/commit/0f6a907f6514bb54041dce8fd88354618295b42d))

## [1.9.1](https://github.com/tippfehlr/activity-roles/compare/v1.7.0..v1.9.1) - 2024-01-05

### Features

- **(commands)** add /setstatusrole ([7e7abe5](https://github.com/tippfehlr/activity-roles/commit/7e7abe524307abc1d7e15428020db9145d00f9c7))
- **(commands/addactivityrole)** set live/temporary to true by default ([23ce948](https://github.com/tippfehlr/activity-roles/commit/23ce9484b10f0ff0bf107e2ef116184a59df23e5))
- **(commands/listactivityroles)** show status roles ([e99b47e](https://github.com/tippfehlr/activity-roles/commit/e99b47e882554e19c520da2a654046b690e2cf45))
- **(commands/stats)** include status roles ([706dcae](https://github.com/tippfehlr/activity-roles/commit/706dcaea37ed0f3f024bd74baaeb3a270a08c2b9))
- **(db/PresenceUpdate)** statusroles backend & refactor ([ab668f4](https://github.com/tippfehlr/activity-roles/commit/ab668f446845d8a7139766213ce247b803b330cf))
- rename live to permanent and reverse the logic ([b46e6db](https://github.com/tippfehlr/activity-roles/commit/b46e6dba68e1ef0ad3b66095d58b55e8e5d35c8c))

### Bug Fixes

- **(commands)** include interaction.id in filename for uploaded files ([e5900d9](https://github.com/tippfehlr/activity-roles/commit/e5900d9db3d09e6e4dfa3b55510f8dbaa10a3e1c))
- **(config)** update invite link permissions ([9955be7](https://github.com/tippfehlr/activity-roles/commit/9955be72d790f36f351d5375cff2ed533e7eb710))
- **(db)** log updated database version after upgrade ([1cbf6a4](https://github.com/tippfehlr/activity-roles/commit/1cbf6a4da9d0b041748561bdace579c9845f856e))
- **(db/PresenceUpdate/activitystats)** don’t add 'Custom Status' to activityStats ([fc91024](https://github.com/tippfehlr/activity-roles/commit/fc910243f2b10b5f7a865fd08887ef20f93b942e))

### Translation

- **(i18n)** new strings ([a613117](https://github.com/tippfehlr/activity-roles/commit/a613117c420b57038979a5b26e538938ee7de890))

### Documentation

- **(commands/help)** remove contributors ([9fa93a4](https://github.com/tippfehlr/activity-roles/commit/9fa93a4bfd31de3649828ef73c2c071d256234c9))
- **(commands/help)** add sponsor notice ([22238b3](https://github.com/tippfehlr/activity-roles/commit/22238b3edcb47c9e6b0e585e814eafac0f6d0e13))
- **(readme)** add sponsor info ([5bde2fd](https://github.com/tippfehlr/activity-roles/commit/5bde2fdfe90b7c59f3e2630393a0e316eac535e9))
- **(readme)** fix sponsor links ([f5d8514](https://github.com/tippfehlr/activity-roles/commit/f5d85140be93af0d5133d46c12083a6acd30ef28))
- add architecture and github workflow for arkit ([1c3648a](https://github.com/tippfehlr/activity-roles/commit/1c3648a4310e50a2d4e0485d6a3b61745d253608))


