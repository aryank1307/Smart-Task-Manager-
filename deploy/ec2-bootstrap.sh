#!/usr/bin/env bash
set -euo pipefail

sudo yum update -y || true
sudo yum install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user || true

echo "EC2 bootstrap complete. Re-login once to refresh docker group permissions."
