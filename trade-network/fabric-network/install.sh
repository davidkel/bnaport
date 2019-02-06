source ./setup_bin.sh
# ---> Dev mode fabric

# standard dev mode single peer
#./fabric/startFabric.sh -d
#CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode install -l node -n demo -p ./dummy -v 0.0.1
#CORE_CHAINCODE_ID_NAME="demo:0.0.1" node chaincode/simpleChaincode.js --peer.address grpc://localhost:7052 &

# uncomment if you are using 2 peer fabric for dev mode
#CORE_PEER_ADDRESS=localhost:8051 CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode install -l node -n demo -p ./dummy -v 0.0.1
#CORE_CHAINCODE_ID_NAME="demo:0.0.1" node chaincode/simpleChaincode.js --peer.address grpc://localhost:8052 &

# <--- Dev mode fabric

# uncomment to use non-development mode fabric
./fabric/startFabric.sh
CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode install -l node -n demo -p ${PWD}/deployable/contract -v 0.0.1

# uncomment if you are using 2 peer fabric for non dev mode
# CORE_PEER_ADDRESS=localhost:8051 CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode install -l node -n demo -p ${PWD}/dummy/ -v 0.0.1
