source ./setup.sh
CORE_PEER_ADDRESS=localhost:8051 CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode query -n demo -c '{"Args":["query","key1"]}' -o 127.0.0.1:7050 -C composerchannel
