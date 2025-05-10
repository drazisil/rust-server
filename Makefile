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
