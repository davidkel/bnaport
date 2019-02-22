#!/bin/bash

# Exit on first error, print all commands.
set -e

#Detect architecture
ARCH=`uname -m`

# Grab the current directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Shut down the Docker containers
DOCKER_FILE="${DIR}"/localfabric/docker-compose.yml

ARCH=$ARCH docker-compose -f "${DOCKER_FILE}" down

# remove chaincode docker images
# docker rmi $(docker images dev-* -q)

# Your system is now clean
