# Changelog

---
## [unreleased]

### Changed

- get user locale from interaction.locale ([1ad1b9a](https://github.com/tippfehlr/activity-roles/commit/1ad1b9abd2789ceaeeefa630218258517d9dfd58))

### Removed

- remove Estonian ([ee891f0](https://github.com/tippfehlr/activity-roles/commit/ee891f054cc57ee9e8d8d7b5f27da904ea1a3df5))
- remove /language and DROP language colums (db version 4) ([bafe74b](https://github.com/tippfehlr/activity-roles/commit/bafe74bad95897e031f38a0978e23b2a426e6068))

---
## [1.10.0](https://github.com/tippfehlr/activity-roles/compare/v1.9.5..v1.10.0) - 2024-04-08

### Added

- **(metrics)** add temporary/permanent/status roles count individually ([84fdc79](https://github.com/tippfehlr/activity-roles/commit/84fdc797c8c349840432989194166fcddcfb78ca))
- **(metrics)** make influxdb organization and bucket customizable via env vars ([b300183](https://github.com/tippfehlr/activity-roles/commit/b300183d1ed656f2df92f741a899d9c349d258e4))
- **(metrics)** add metrics for added temporary/permanent roles ([59160f5](https://github.com/tippfehlr/activity-roles/commit/59160f510d5c3f24828b9110ab2ac0074beddabf))
- infer log level from env variable LOG_LEVEL, default to 'info' ([b536ded](https://github.com/tippfehlr/activity-roles/commit/b536ded4b470ddad8c60e837ec41329f4e40271a))
- logs/metrics for presence_update execution time ([dad307c](https://github.com/tippfehlr/activity-roles/commit/dad307c2d1f5620e98c59abf9096582df7792eb3))
- change runtime from node.js to bun ([3ed438d](https://github.com/tippfehlr/activity-roles/commit/3ed438da724c9772a611787eecfc41b288bfb44b))
- add /checkroles ([1dbaa56](https://github.com/tippfehlr/activity-roles/commit/1dbaa56e6ef6046bb4d312099371d195f43d4b9d))
- gracefully exit by listening for SIG{TERM,INT} ([cb7d703](https://github.com/tippfehlr/activity-roles/commit/cb7d703141d840e595b83c71b1bf1ce219f49479))
- add French ([53f7dd7](https://github.com/tippfehlr/activity-roles/commit/53f7dd7afc61197de67594d660280910343b1018))

### Fixed

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

---
## [1.9.5](https://github.com/tippfehlr/activity-roles/compare/v1.9.4..v1.9.5) - 2024-03-09

### Fixed

- **(commands/help)** remove embed for commands ([fa4fd52](https://github.com/tippfehlr/activity-roles/commit/fa4fd524f0fd753b0194d11f9ef30fe5fdaea7ef))
- fix docker image in compose.yaml ([5dfaee8](https://github.com/tippfehlr/activity-roles/commit/5dfaee897810ccb1ec8a548fe7e2c205fe5eec8c))

---
## [1.9.4](https://github.com/tippfehlr/activity-roles/compare/v1.9.3..v1.9.4) - 2024-03-09

### Added

- **(i18n)** add Estonian (Thanks @itshendrik!) ([4f59614](https://github.com/tippfehlr/activity-roles/commit/4f596148bd94ed3bae60b5bddcaf2f136f36ba03))

### Fixed

- **(readme)** fix eianlee’s name ([f52e74f](https://github.com/tippfehlr/activity-roles/commit/f52e74ffd5c06b1e271c13d5ef64b63c5f6143a9))

---
## [1.9.3](https://github.com/tippfehlr/activity-roles/compare/v1.9.2..v1.9.3) - 2024-03-09

### Added

- send metrics to influxdb ([1837135](https://github.com/tippfehlr/activity-roles/commit/1837135e02d88b9b160492b8bd78621978023a99))
- metrics for database access ([6992972](https://github.com/tippfehlr/activity-roles/commit/69929724d6014cee7cf4057663aa670a4038249f))
- send new metrics: memory and metric execution time ([8fff5ed](https://github.com/tippfehlr/activity-roles/commit/8fff5ede42b94f2bcdd10261b774081eb5c882b7))

### Fixed

- **(readme)** remove > from invite link (text) ([206b23a](https://github.com/tippfehlr/activity-roles/commit/206b23a16e281c2b84e0446e81bfd3ee7dfc8eec))
- stats don’t reset ([1e58a46](https://github.com/tippfehlr/activity-roles/commit/1e58a46b240cf0d9467e54aaa70738c0d5658f0f))

### Documentation

- remove star notice ([70f81cd](https://github.com/tippfehlr/activity-roles/commit/70f81cd8342b6aac894b5dd75a3fb0c93a7d5733))
- rename compose file to compose.yaml, add new variables ([92381f9](https://github.com/tippfehlr/activity-roles/commit/92381f9a5f5b0c9b87530d564f2ae656dc105e11))

---
## [1.9.2](https://github.com/tippfehlr/activity-roles/compare/v1.9.1..v1.9.2) - 2024-01-06

### Fixed

- **(commands/addactivityrole)** change description to match `permanent` ([d67a505](https://github.com/tippfehlr/activity-roles/commit/d67a505e48ae497f3e6a0eb3a658cf8c4dc5f055))
- set status roles to permanent=false ([5bfd2bd](https://github.com/tippfehlr/activity-roles/commit/5bfd2bdff952f1a660e6bfd3fac21d938420e70f))
- set the current dbversion in new databases ([0f6a907](https://github.com/tippfehlr/activity-roles/commit/0f6a907f6514bb54041dce8fd88354618295b42d))

---
## [1.9.1](https://github.com/tippfehlr/activity-roles/compare/v1.7.0..v1.9.1) - 2024-01-05

### Added

- **(commands)** add /setstatusrole ([7e7abe5](https://github.com/tippfehlr/activity-roles/commit/7e7abe524307abc1d7e15428020db9145d00f9c7))
- **(commands/addactivityrole)** set live/temporary to true by default ([23ce948](https://github.com/tippfehlr/activity-roles/commit/23ce9484b10f0ff0bf107e2ef116184a59df23e5))
- **(commands/listactivityroles)** show status roles ([e99b47e](https://github.com/tippfehlr/activity-roles/commit/e99b47e882554e19c520da2a654046b690e2cf45))
- **(commands/stats)** include status roles ([706dcae](https://github.com/tippfehlr/activity-roles/commit/706dcaea37ed0f3f024bd74baaeb3a270a08c2b9))
- **(db/PresenceUpdate)** statusroles backend & refactor ([ab668f4](https://github.com/tippfehlr/activity-roles/commit/ab668f446845d8a7139766213ce247b803b330cf))
- rename live to permanent and reverse the logic ([b46e6db](https://github.com/tippfehlr/activity-roles/commit/b46e6dba68e1ef0ad3b66095d58b55e8e5d35c8c))

### Fixed

- **(commands)** include interaction.id in filename for uploaded files ([e5900d9](https://github.com/tippfehlr/activity-roles/commit/e5900d9db3d09e6e4dfa3b55510f8dbaa10a3e1c))
- **(config)** update invite link permissions ([9955be7](https://github.com/tippfehlr/activity-roles/commit/9955be72d790f36f351d5375cff2ed533e7eb710))
- **(db)** log updated database version after upgrade ([1cbf6a4](https://github.com/tippfehlr/activity-roles/commit/1cbf6a4da9d0b041748561bdace579c9845f856e))
- **(db/PresenceUpdate/activitystats)** don’t add 'Custom Status' to activityStats ([fc91024](https://github.com/tippfehlr/activity-roles/commit/fc910243f2b10b5f7a865fd08887ef20f93b942e))

### Documentation

- **(commands/help)** remove contributors ([9fa93a4](https://github.com/tippfehlr/activity-roles/commit/9fa93a4bfd31de3649828ef73c2c071d256234c9))
- **(commands/help)** add sponsor notice ([22238b3](https://github.com/tippfehlr/activity-roles/commit/22238b3edcb47c9e6b0e585e814eafac0f6d0e13))
- **(readme)** add sponsor info ([5bde2fd](https://github.com/tippfehlr/activity-roles/commit/5bde2fdfe90b7c59f3e2630393a0e316eac535e9))
- **(readme)** fix sponsor links ([f5d8514](https://github.com/tippfehlr/activity-roles/commit/f5d85140be93af0d5133d46c12083a6acd30ef28))
- add architecture and github workflow for arkit ([1c3648a](https://github.com/tippfehlr/activity-roles/commit/1c3648a4310e50a2d4e0485d6a3b61745d253608))

<!-- generated by git-cliff -->
