#!/bin/bash
export CLOUDSDK_PYTHON=/opt/homebrew/bin/python3
/opt/homebrew/share/google-cloud-sdk/bin/gcloud run deploy cityops-backend --source . --region asia-south1 --allow-unauthenticated
