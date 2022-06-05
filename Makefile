NODEJS_APP_RUN=docker-compose run --rm --no-deps nodejs-app

_app-start-db:
	@docker-compose up --remove-orphans -d db


app-dbmate-up: _app-start-db ## dbmate up.
	@$(NODEJS_APPL_RUN) npm run dbmate -- up

app-dbmate-down: _app-start-db ## dbmate down.
	@$(NODEJS_APPL_RUN) npm run dbmate -- down

app-dbmate-new: ## Create a new app db migration.
	@$(NODEJS_APPL_RUN) npm run dbmate -- new $(migration)

app-dbmate-dump: ## Dump the app schema.
	@$(NODEJS_APPL_RUN) npm run dbmate -- dump
