source ./setup_bin.sh
CORE_PEER_MSPCONFIGPATH=${MSP} ${PEER} chaincode package mycc.cds -l node -n trade-network -p ${PWD}/deployable/contract -v 0.1.0
