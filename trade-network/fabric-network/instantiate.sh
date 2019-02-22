source ./setup_bin.sh

CORE_PEER_LOCALMSPID=${MSPID} CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode instantiate -o localhost:7050 -C composerchannel -l node -n trade-network -v 0.0.1 -c '{"Args":["instantiate", "key1", "1", "key2", "2"]}'
