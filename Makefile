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
