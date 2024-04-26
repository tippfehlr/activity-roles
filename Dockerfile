FROM --platform=$BUILDPLATFORM node:current-alpine AS build
WORKDIR /activity-roles/
RUN apk add python3 make g++ jq
RUN npm i -g pnpm
COPY tsconfig.json pnpm-lock.yaml .
COPY package.json /tmp
RUN jq '{ dependencies, devDependencies }' < /tmp/package.json > ./package.json
RUN pnpm i
COPY src src
RUN ./node_modules/typescript/bin/tsc --outDir out/

FROM node:current-alpine AS release
WORKDIR /activity-roles/
RUN apk add python3 make g++
RUN npm i -g pnpm
COPY img/discord-header.png img/discord-header.png
COPY locales locales
COPY pnpm-lock.yaml .
COPY --from=build /activity-roles/package.json ./package.json
RUN pnpm i -P
COPY --from=build /activity-roles/out src

VOLUME ["/activity-roles/db"]
ENTRYPOINT ["node", "src/index.js"]
