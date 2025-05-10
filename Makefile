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

# Add a target to generate Cobertura report
coverage/cobertura.xml:
	mkdir -p coverage
	cargo tarpaulin --out Xml --output-dir coverage

# Update the coverage target to include both HTML and Cobertura reports
.PHONY: coverage
coverage: coverage/html/index.html coverage/cobertura.xml

coverage/html/index.html:
	mkdir -p coverage
	cargo tarpaulin --out Html --output-dir coverage
