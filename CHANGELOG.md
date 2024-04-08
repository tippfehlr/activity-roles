# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.10.0](https://github.com/tippf3hlr/activity-roles/compare/v1.9.5...v1.10.0) (2024-04-08)


### Features

* add French ([53f7dd7](https://github.com/tippf3hlr/activity-roles/commit/53f7dd7afc61197de67594d660280910343b1018))
* gracefully exit by listening for SIG{TERM,INT} ([cb7d703](https://github.com/tippf3hlr/activity-roles/commit/cb7d703141d840e595b83c71b1bf1ce219f49479))
* infer log level from env variable LOG_LEVEL, default to 'info' ([b536ded](https://github.com/tippf3hlr/activity-roles/commit/b536ded4b470ddad8c60e837ec41329f4e40271a))
* logs/metrics for presence_update execution time ([dad307c](https://github.com/tippf3hlr/activity-roles/commit/dad307c2d1f5620e98c59abf9096582df7792eb3))
* **metrics:** add metrics for added temporary/permanent roles ([59160f5](https://github.com/tippf3hlr/activity-roles/commit/59160f510d5c3f24828b9110ab2ac0074beddabf))
* **metrics:** add temporary/permanent/status roles count individually ([84fdc79](https://github.com/tippf3hlr/activity-roles/commit/84fdc797c8c349840432989194166fcddcfb78ca))
* **metrics:** make influxdb organization and bucket customizable via env vars ([b300183](https://github.com/tippf3hlr/activity-roles/commit/b300183d1ed656f2df92f741a899d9c349d258e4))


### Bug Fixes

* check if bot’s highest role is higher than role when removing roles ([30944db](https://github.com/tippf3hlr/activity-roles/commit/30944dbbe4c1bea8373335030acfcea0e8a8b839))
* leave guilds without permission ([fe11ac4](https://github.com/tippf3hlr/activity-roles/commit/fe11ac419b8d2cc81eae09e82b0e07eeaec6bc85)), closes [#61](https://github.com/tippf3hlr/activity-roles/issues/61)
* **presenceUpdate:** don’t fetch() members ([0ded481](https://github.com/tippf3hlr/activity-roles/commit/0ded48156fc5f4ffed5a5f7ec07d1c842131414c))

## [1.9.5](https://github.com/tippf3hlr/activity-roles/compare/v1.9.4...v1.9.5) (2024-03-09)


### Bug Fixes

* **commands/help:** remove embed for commands ([fa4fd52](https://github.com/tippf3hlr/activity-roles/commit/fa4fd524f0fd753b0194d11f9ef30fe5fdaea7ef))
* fix docker image in compose.yaml ([5dfaee8](https://github.com/tippf3hlr/activity-roles/commit/5dfaee897810ccb1ec8a548fe7e2c205fe5eec8c))

## [1.9.4](https://github.com/tippf3hlr/activity-roles/compare/v1.9.3...v1.9.4) (2024-03-09)


### Features

* **i18n:** add Estonian (Thanks [@itshendrik](https://github.com/itshendrik)!) ([4f59614](https://github.com/tippf3hlr/activity-roles/commit/4f596148bd94ed3bae60b5bddcaf2f136f36ba03)), closes [#73](https://github.com/tippf3hlr/activity-roles/issues/73)


### Bug Fixes

* **readme:** fix eianlee’s name ([f52e74f](https://github.com/tippf3hlr/activity-roles/commit/f52e74ffd5c06b1e271c13d5ef64b63c5f6143a9))

## [1.9.3](https://github.com/tippf3hlr/activity-roles/compare/v1.9.2...v1.9.3) (2024-03-09)


### Features

* metrics for database access ([6992972](https://github.com/tippf3hlr/activity-roles/commit/69929724d6014cee7cf4057663aa670a4038249f))
* send metrics to influxdb ([1837135](https://github.com/tippf3hlr/activity-roles/commit/1837135e02d88b9b160492b8bd78621978023a99))
* send new metrics: memory and metric execution time ([8fff5ed](https://github.com/tippf3hlr/activity-roles/commit/8fff5ede42b94f2bcdd10261b774081eb5c882b7))


### Bug Fixes

* **readme:** remove > from invite link (text) ([206b23a](https://github.com/tippf3hlr/activity-roles/commit/206b23a16e281c2b84e0446e81bfd3ee7dfc8eec))
* stats don’t reset ([1e58a46](https://github.com/tippf3hlr/activity-roles/commit/1e58a46b240cf0d9467e54aaa70738c0d5658f0f))

## [1.9.2](https://github.com/tippf3hlr/activity-roles/compare/v1.9.1...v1.9.2) (2024-01-06)


### Bug Fixes

* **commands/addactivityrole:** change description to match `permanent` ([d67a505](https://github.com/tippf3hlr/activity-roles/commit/d67a505e48ae497f3e6a0eb3a658cf8c4dc5f055))
* set status roles to permanent=false ([5bfd2bd](https://github.com/tippf3hlr/activity-roles/commit/5bfd2bdff952f1a660e6bfd3fac21d938420e70f))
* set the current dbversion in new databases ([0f6a907](https://github.com/tippf3hlr/activity-roles/commit/0f6a907f6514bb54041dce8fd88354618295b42d))

## [1.9.1](https://github.com/tippf3hlr/activity-roles/compare/v1.9.0...v1.9.1) (2024-01-05)


### Features

* **commands/addactivityrole:** set live/temporary to true by default ([23ce948](https://github.com/tippf3hlr/activity-roles/commit/23ce9484b10f0ff0bf107e2ef116184a59df23e5)), closes [#62](https://github.com/tippf3hlr/activity-roles/issues/62) [#57](https://github.com/tippf3hlr/activity-roles/issues/57)
* rename live to permanent and reverse the logic ([b46e6db](https://github.com/tippf3hlr/activity-roles/commit/b46e6dba68e1ef0ad3b66095d58b55e8e5d35c8c)), closes [#46](https://github.com/tippf3hlr/activity-roles/issues/46)


### Bug Fixes

* **config:** update invite link permissions ([9955be7](https://github.com/tippf3hlr/activity-roles/commit/9955be72d790f36f351d5375cff2ed533e7eb710))
