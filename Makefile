# WorkHub Attendance System — Makefile
# Manage the Next.js app, PostgreSQL (Docker), Prisma DB, and helpers.

.DEFAULT_GOAL := help

# Config
APP_PORT      ?= 3000
COMPOSE       ?= docker compose
CONTAINER     := attendance_postgres
PID_FILE      := .dev-server.pid
LOG_FILE      := .dev-server.log

# Colors
COLOR_RESET   := \033[0m
COLOR_CYAN    := \033[36m
COLOR_GREEN   := \033[32m
COLOR_YELLOW  := \033[33m
COLOR_RED     := \033[31m

.PHONY: help install db-up db-down db-restart db-logs db-status \
        db-migrate db-push db-seed db-studio db-reset \
        dev start stop restart status logs build lint clean \
        setup fresh

##@ Help
help: ## Show this help message
	@echo ""
	@echo "WorkHub Attendance System"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "  $(COLOR_CYAN)%-20s$(COLOR_RESET) %s\n", "Target", "Description" } \
		/^[a-zA-Z_-]+:.*?##/ { printf "  $(COLOR_GREEN)%-20s$(COLOR_RESET) %s\n", $$1, $$2 } \
		/^##@/ { printf "\n$(COLOR_YELLOW)%s$(COLOR_RESET)\n", substr($$0, 5) }' $(MAKEFILE_LIST)
	@echo ""

##@ Setup
install: ## Install npm dependencies
	npm install

setup: db-up install db-migrate db-seed ## Full first-time setup: start DB, install deps, migrate, seed
	@echo "$(COLOR_GREEN)Setup complete. Run 'make dev' to start the app.$(COLOR_RESET)"

fresh: db-down db-up install db-migrate db-seed ## Wipe and recreate DB from scratch (DESTRUCTIVE)
	@echo "$(COLOR_YELLOW)Fresh database initialized.$(COLOR_RESET)"

##@ Database (Docker)
db-up: ## Start PostgreSQL container
	$(COMPOSE) up -d
	@echo "$(COLOR_GREEN)PostgreSQL started on port 5432$(COLOR_RESET)"

db-down: ## Stop PostgreSQL container
	$(COMPOSE) down
	@echo "$(COLOR_YELLOW)PostgreSQL stopped$(COLOR_RESET)"

db-restart: ## Restart PostgreSQL container
	$(COMPOSE) restart
	@echo "$(COLOR_GREEN)PostgreSQL restarted$(COLOR_RESET)"

db-logs: ## Tail PostgreSQL container logs
	$(COMPOSE) logs -f postgres

db-status: ## Show PostgreSQL container status
	$(COMPOSE) ps

##@ Database (Prisma)
db-migrate: ## Apply Prisma migrations
	npm run db:migrate

db-push: ## Push Prisma schema without migration history
	npm run db:push

db-seed: ## Seed demo data
	npm run db:seed

db-studio: ## Open Prisma Studio GUI at localhost:5555
	npm run db:studio

db-reset: ## Drop all data and re-seed (DESTRUCTIVE)
	@echo "$(COLOR_RED)This will wipe all data. Press Ctrl+C to abort...$(COLOR_RESET)"
	@sleep 3
	$(COMPOSE) down -v
	$(COMPOSE) up -d
	npm run db:migrate
	npm run db:seed
	@echo "$(COLOR_GREEN)Database reset and seeded.$(COLOR_RESET)"

##@ Application
dev: ## Start Next.js dev server (foreground)
	npm run dev

start: ## Start Next.js dev server in background
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "$(COLOR_YELLOW)Dev server already running (PID $$(cat $(PID_FILE))).$(COLOR_RESET)"; \
	else \
		npm run dev > $(LOG_FILE) 2>&1 & echo $$! > $(PID_FILE); \
		echo "$(COLOR_GREEN)Dev server started in background (PID $$(cat $(PID_FILE))).$(COLOR_RESET)"; \
		echo "Logs: tail -f $(LOG_FILE)  |  URL: http://localhost:$(APP_PORT)"; \
	fi

stop: ## Stop background dev server
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		kill $$(cat $(PID_FILE)) && rm -f $(PID_FILE); \
		echo "$(COLOR_GREEN)Dev server stopped.$(COLOR_RESET)"; \
	else \
		rm -f $(PID_FILE); \
		echo "$(COLOR_YELLOW)No running dev server found.$(COLOR_RESET)"; \
	fi

restart: stop start ## Restart background dev server

status: ## Show dev server status
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "$(COLOR_GREEN)Dev server running (PID $$(cat $(PID_FILE))).$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_YELLOW)Dev server is not running.$(COLOR_RESET)"; \
	fi

logs: ## Tail background dev server logs
	@if [ -f $(LOG_FILE) ]; then tail -f $(LOG_FILE); \
	else echo "$(COLOR_YELLOW)No log file found. Is the server running via 'make start'?$(COLOR_RESET)"; fi

##@ Build & Quality
build: ## Production build
	npm run build

lint: ## Run ESLint
	npm run lint

##@ Cleanup
clean: ## Remove build artifacts and dev server files
	rm -rf .next node_modules/.cache $(PID_FILE) $(LOG_FILE)
	@echo "$(COLOR_GREEN)Cleaned build artifacts.$(COLOR_RESET)"
