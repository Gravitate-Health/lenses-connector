#!/bin/bash

docker build -t gravitate-registry.cr.de-fra.ionos.com/lenses-connector:latest .

docker push gravitate-registry.cr.de-fra.ionos.com/lenses-connector:latest

