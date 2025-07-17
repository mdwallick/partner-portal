#!/bin/bash

ENV_VARS=$(paste -sd, .env.local | sed 's/ //g')

gcloud run deploy acul-demo --source . --allow-unauthenticated --set-env-vars "$ENV_VARS"

# gcloud run services update acul-demo --set-env-vars "$ENV_VARS"
