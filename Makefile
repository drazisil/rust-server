# Makefile for building and testing the Rust server

# Add inline comments for each target to provide descriptions
.PHONY: all
all: build # Default target to build the project

.PHONY: build
build: # Compile the Rust code using Docker
	docker build -t rust-ci .
	docker run --env-file .env rust-ci

.PHONY: test
test: # Run all test cases
	cargo test

.PHONY: clean
clean: # Remove build artifacts
	cargo clean

.PHONY: coverage
coverage: # Generate HTML and Cobertura coverage reports using Docker
	mkdir -p coverage
	docker run --env-file .env rust-ci cargo tarpaulin --out Html --out Xml --output-dir coverage
	docker cp $(shell docker ps -lq):/app/coverage ./coverage

.PHONY: install-tarpaulin
install-tarpaulin: # Install cargo-tarpaulin
	cargo install cargo-tarpaulin

.PHONY: migrate
migrate: # Run database migrations
	cargo sqlx migrate run

.PHONY: help
help: # Show this help message
	@echo "Available targets:"
	@grep -E '^\.PHONY: ' Makefile | sed 's/\.PHONY: //g' | while read -r target; do \
		description=$$(grep "^$$target:" Makefile | sed -n 's/.*# //p'); \
		if [ -n "$$description" ]; then \
			echo "  $$target - $$description"; \
		else \
			echo "  $$target - No description available"; \
		fi; \
	done
