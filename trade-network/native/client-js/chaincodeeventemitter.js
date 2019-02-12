const EventEmitter = require('events');

class ChaincodeEventEmitter extends EventEmitter {

    constructor(network, mspid, contractName) {
        super();
        this.network = network;
        this.mspid = mspid;
        this.contractName = contractName;
    }

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

    disconnect() {
        this.eventHub.unregisterChaincodeEvent(this.handle);
        this.eventHub.disconnect();  // must disconnect the event hub or app will hang
    }
}

module.exports = ChaincodeEventEmitter;