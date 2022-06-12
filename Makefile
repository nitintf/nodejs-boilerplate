NODEJS_APP_RUN=docker-compose run --rm --no-deps nodejs-app

_app-start-db:
	@docker-compose up --remove-orphans -d db


app-dbmate-up: _app-start-db ## dbmate up.
	@$(NODEJS_APP_RUN) npm run dbmate -- up

app-dbmate-down: _app-start-db ## dbmate down.
	@$(NODEJS_APP_RUN) npm run dbmate -- down

app-dbmate-new: ## Create a new app db migration.
	@$(NODEJS_APP_RUN) npm run dbmate -- new $(migration)

app-dbmate-dump: ## Dump the app schema.
	@$(NODEJS_APP_RUN) npm run dbmate -- dump

app-npm-install: ## Install app npm packages.
	@$(NODEJS_APP_RUN) npm install

app-package-lock: ## Generate the app package-lock.json
	@$(NODEJS_APP_RUN) npm install --package-lock-only

app-unit: ## Run the app unit tests.
	@$(NODEJS_APP_RUN) npm run unit

app-clean: ## Run clean script
	@$(NODEJS_APP_RUN) npm run clean

app-integration: _app-start-db ## Run the app intgegration tests.
	@$(NODEJS_APP_RUN) npm run integration

app-integration-watch: _app-start-db ## Run the app intgegration tests in watch mode.
	@$(NODEJS_APP_RUN) npm run integration:watch
