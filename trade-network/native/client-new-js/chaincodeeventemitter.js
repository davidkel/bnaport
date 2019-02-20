const EventEmitter = require('events');

/**
 * This class provides a simple way to register for chaincode events
 * and have them emitted through the event emitter capabilities of
 * node. This implementation does not provide any support for
 * 1. guaranteed delivery through event replay
 * 2. Any mechanism to recover from loss of connection to the event hub
 */
class ChaincodeEventEmitter extends EventEmitter {

    /**
     * constructor
     * @param network The network instance from the gateway
     * @param mspid your organisations mspid
     * @param contractName the contractName (chaincodeid) for the events
     */    
    constructor(network, mspid, contractName) {
        super();
        this.network = network;
        this.mspid = mspid;
        this.contractName = contractName;
    }

    /**
     * initialize this chaincode event emitter by creating a channel event
     * hub and registering to listen for chaincode events.
     */
    async initialize() {
        const channel = this.network.getChannel();
        const peers = channel.getPeersForOrg(this.mspid);
        this.eventHub = channel.newChannelEventHub(peers[0].getPeer());

        const waitToConnect = new Promise((resolve, reject) => {
            this.eventHub.connect(true, (err, eventHub) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
        await waitToConnect;

        // we've connected, so register to listen for chaincode events. If we did this before
        // connection then if the last block has any chaincode events they could be re-emitted
        this.handle = this.eventHub.registerChaincodeEvent(this.contractName, 'trade-network',
            (event, blockNum, txID, status) => {
                if (status && status === 'VALID') {
                    let evt = event.payload.toString('utf8');
                    evt = JSON.parse(evt);
                    if (Array.isArray(evt)) {
                        for(const oneEvent of evt) {
                            this.emit('ChaincodeEvent', oneEvent);
                        }
                    }
                    else {
                        this.emit('ChaincodeEvent', evt);
                    }
                }
            },
            (err) => {
                this.emit('error', err);
            }
        );
        
    }

    /**
     * destroy this chaincode event emitter. You must call this when you
     * are no longer interested is receiving chaincode events otherwise your
     * application will hang on termination 
     */    
    destroy() {
        this.eventHub.unregisterChaincodeEvent(this.handle);
        this.eventHub.disconnect();  // must disconnect the event hub or app will hang
    }
}

module.exports = ChaincodeEventEmitter;