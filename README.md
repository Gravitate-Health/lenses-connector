# Lenses Connector

A Node.js service that fetches FHIR `Library` resources (lenses) from remote GitHub repositories and uploads/updates them to a FHIR server. It runs as a Kubernetes CronJob on a daily schedule.

## Overview

The service iterates over a list of lens JSON URLs defined in `json_urls.js`, checks whether each resource already exists on the target FHIR server (by `identifier.value`), and either creates or updates it accordingly.

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Docker](https://www.docker.com/) (for container builds)
- Access to a FHIR server exposing a `Library` endpoint

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `SERVER_ENDPOINT` | `http://gravitate-health.lst.tfo.upm.es/epi/api/fhir/Library` | FHIR server Library endpoint |

## Running Locally

```bash
npm install
npm start
```

Override the server endpoint if needed:

```bash
SERVER_ENDPOINT=http://localhost:8080/fhir/Library npm start
```

## Adding or Removing Lenses

Edit `json_urls.js` to add or remove raw JSON URLs pointing to FHIR `Library` resources:

```js
module.exports = [
    "https://raw.githubusercontent.com/Gravitate-Health/lens-logic-test-lab/refs/heads/main/lab-lens.json",
    // ...
];
```

## Docker

Build and push the image to the GitHub Container Registry:

```bash
./build-and-publish-image.sh
```

The image is published to `ghcr.io/gravitate-health/lenses-connector:latest`.

## Kubernetes Deployment

A CronJob manifest is provided under `kubernetes/dev/cronjob.yaml`. It runs the connector daily at 04:00 UTC.

```bash
kubectl apply -f kubernetes/dev/cronjob.yaml
```

