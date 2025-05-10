# Makefile for building and testing the Rust server

# Add inline comments for each target to provide descriptions
.PHONY: all
all: build # Default target to build the project

.PHONY: build
build: # Compile the Rust code
	cargo build

.PHONY: test
test: # Run all test cases
	cargo test

.PHONY: clean
clean: # Remove build artifacts
	cargo clean

.PHONY: coverage
coverage: # Generate HTML and Cobertura coverage reports
	mkdir -p coverage
	cargo tarpaulin --out Html --out Xml --output-dir coverage

.PHONY: install-tarpaulin
install-tarpaulin: # Install cargo-tarpaulin
	cargo install cargo-tarpaulin

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
