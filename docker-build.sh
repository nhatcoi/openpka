#!/bin/bash

# Build and push Docker image to Docker Hub
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t noahdev206/openacademix-app:latest \
  --push .
