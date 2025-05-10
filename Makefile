# Makefile for building and testing the Rust server

# Default target
.PHONY: all
all: build

# Build the project
.PHONY: build
build:
	cargo build

# Run tests
.PHONY: test
test:
	cargo test

# Clean the project
.PHONY: clean
clean:
	cargo clean

# Combine tarpaulin commands to generate both HTML and Cobertura reports in a single run
.PHONY: coverage
coverage:
	mkdir -p coverage
	cargo tarpaulin --out Html --out Xml --output-dir coverage

# Update the help target to dynamically list all PHONY targets
.PHONY: help
help:
	@echo "Available targets:"
	@grep -E '^\.PHONY: ' Makefile | sed 's/\.PHONY: //g' | while read -r target; do \
		echo "  $$target - $$(grep -A 1 "^\.PHONY: $$target" Makefile | tail -n 1 | sed 's/^# //')"; \
	done
