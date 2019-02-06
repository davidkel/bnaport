#!/bin/bash

# change the line below to match you env or export yourself
if [[ ! -n "$FABRIC_BIN"  ]]; then
	export FABRIC_BIN=${PWD}/bin/121
fi

echo ${FABRIC_BIN}
# rest of the setup.
export FABRIC_CFG_PATH=${FABRIC_BIN}
export PEER=${FABRIC_BIN}/peer
export MSP=${PWD}/fabric/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export MSPID=Org1MSP

# chaincode to run
export CHAINCODE=${PWD}/../native/fabric-new-ts/contract
