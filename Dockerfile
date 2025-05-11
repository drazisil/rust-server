# Use the latest stable Rust image as the base image
FROM rust:latest

# Install dependencies
RUN apt-get update && apt-get install -y libpq-dev pkg-config

# Set the working directory
WORKDIR /app

# Copy the project files
COPY . .

# Install cargo-chef for dependency caching
RUN cargo install cargo-chef

# Prepare the recipe for caching dependencies
RUN cargo chef prepare --recipe-path recipe.json

# Cache dependencies
RUN cargo chef cook --release --recipe-path recipe.json

# Build the project
RUN cargo build --release

# Default command to run tests
CMD ["cargo", "test"]
