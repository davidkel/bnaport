source ./setup_bin.sh
if [[ ! -n "$VER"  ]]; then
    export VER=1.4.0
    echo VER not defined, setting it to 1.4.0
fi

# ---> Dev mode fabric

# standard dev mode single peer
./fabric/startFabric.sh -d
CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode install -l node -n trade-network -p ./dummy -v 0.0.1

# uncomment if you are using 2 peer fabric for dev mode
# CORE_PEER_ADDRESS=localhost:8051 CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode install -l node -n trade-network -p ./dummy -v 0.0.1

cd ${CHAINCODE}
npm start -- --peer.address grpc://localhost:7052 --chaincode-id-name trade-network:0.0.1 &
# uncomment if you are using 2 peer fabric for dev mode
# npm start -- --peer.address grpc://localhost:8052 --chaincode-id-name trade-network:0.0.1 &

# example of starting chaincode if not using contract api as package.json npm start is 
# a contract example
# CORE_CHAINCODE_ID_NAME="trade-network:0.0.1" node chaincode/simpleChaincode.js --peer.address grpc://localhost:7052 &

# <--- Dev mode fabric

# uncomment to use non-development mode fabric and comment dev version out
# ./fabric/startFabric.sh
# CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode install -l node -n trade-network -p ${PWD}/deployable/contract -v 0.0.1

# uncomment if you are using 2 peer fabric for non dev mode
# CORE_PEER_ADDRESS=localhost:8051 CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode install -l node -n trade-network -p ${PWD}/dummy/ -v 0.0.1

cd -
sleep 5
CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode instantiate -o localhost:7050 -C mychannel -l node -n trade-network -v 0.0.1 -c '{"Args":["instantiate", "key1", "1", "key2", "2"]}' -P "OR ('Org1MSP.member')"
