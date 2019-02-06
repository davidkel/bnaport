#!/bin/bash

# change the line below to match you env or export yourself
if [[ ! -n "$FABRIC_SRC"  ]]; then
	export FABRIC_SRC=~/src/go/src/github.com/hyperledger
fi

echo ${FABRIC_SRC}
# rest of the setup.
export FABRIC_CFG_PATH=${FABRIC_SRC}/fabric/sampleconfig
export PEER=${FABRIC_SRC}/fabric/.build/bin/peer
export MSP=${FABRIC_SRC}/fabric-sdk-node/fabric-network/e2e/fabric/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export MSPID=Org1MSP
