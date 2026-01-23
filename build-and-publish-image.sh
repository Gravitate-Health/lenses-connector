#!/bin/bash

docker build -t ghcr.io/gravitate-health/lenses-connector:latest .

docker push ghcr.io/gravitate-health/lenses-connector:latest

