.PHONY: db
db:
	-docker stop temp-postgres
	docker run -d --rm --name temp-postgres \
		-e POSTGRES_USER=postgres \
		-e POSTGRES_DB=activity-roles \
		-e POSTGRES_PASSWORD=postgres \
		-p 5432:5432 \
		docker.io/postgres
	until pg_isready -h localhost -p 5432 -U postgres; do sleep 1; done

.PHONY: run
run:
	ts-node src/index.ts

.PHONY: kysely-codegen
kysely-codegen:
	./node_modules/.bin/kysely-codegen --out-file src/modules/db.types.ts


.PHONY: docker-push
docker-push:
	docker buildx build \
		--platform=linux/amd64,linux/arm64 \
		-t ghcr.io/tippfehlr/activity-roles:test \
		--push .


.PHONY: mkdocs
mkdocs:
	docker run --rm -it \
		-e UID=1000 \
		-e GID=1000 \
		-p 8000:8000 \
		-v ./docs:/docs \
		squidfunk/mkdocs-material


.PHONY: release
release:
	./release.fish

.PHONY: format
format:
	prettier -w src/*
