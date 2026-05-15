.PHONY: dev build preview lint lint-fix format docker-up docker-down docker-build clean

# Default target
help:
	@echo "Available targets:"
	@echo ""
	@echo "  dev          Start local development server"
	@echo "  build        Type-check and build for production"
	@echo "  preview      Preview production build locally"
	@echo "  lint         Run ESLint check"
	@echo "  lint-fix     Run ESLint with auto-fix"
	@echo "  format       Run Prettier formatting"
	@echo ""
	@echo "  docker-up    Start Docker containers"
	@echo "  docker-down  Stop Docker containers"
	@echo "  docker-build Build Docker image"
	@echo ""
	@echo "  clean        Remove build artifacts and node_modules"

# Development
dev:
	npm run dev

# Build
build:
	npm run build

# Preview production build
preview:
	npm run preview

# Code quality
lint:
	npm run lint

lint-fix:
	npm run lint:fix

format:
	npm run format

# Docker
docker-build:
	docker build -t snowgo-vue .

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

# Cleanup
clean:
	rm -rf dist
	rm -rf node_modules
