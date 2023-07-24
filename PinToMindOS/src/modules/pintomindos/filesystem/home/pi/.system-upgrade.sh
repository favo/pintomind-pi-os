#!/bin/bash

set -e

# Lets packages know that we are running in a non-interactive environment, 
# so they don't try to prompt us for input
DEBIAN_FRONTEND=noninteractive

sudo apt update
sudo apt upgrade -y

