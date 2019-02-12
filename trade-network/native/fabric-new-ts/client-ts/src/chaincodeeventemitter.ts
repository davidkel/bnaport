import {EventEmitter} from 'events'
import { Network } from 'fabric-network';
import { Channel, Peer, ChannelEventHub, ChannelPeer, ChaincodeEvent } from 'fabric-client';


export class ChaincodeEventEmitter extends EventEmitter {

    network: Network;
    eventHub: any; //Bug ChannelEventHub not declared correctly;
    handle: any; // Bug: not been exported ChaincodeChannelEventHandle
    mspid: string;
    contractName: string;

    constructor(network: Network, mspid: string, contractName) {
        super();
        this.network = network;
        this.mspid = mspid;
        this.contractName = contractName;
    }

    async initialize(): Promise<void> {
        const channel: Channel = this.network.getChannel();
        const peers: ChannelPeer[] = channel.getPeersForOrg(this.mspid);
        this.eventHub = channel.newChannelEventHub(peers[0].getPeer());

        const waitToConnect: Promise<any> = new Promise((resolve, reject) => {
            // Bug: Callback not defined in typescript
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
            (event: ChaincodeEvent, blockNum: number, txID: string, status: string) => {
                if (status && status === 'VALID') {
                    let evt: any = event.payload.toString('utf8');
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

    disconnect() : void {
        this.eventHub.unregisterChaincodeEvent(this.handle);
        this.eventHub.disconnect();  // must disconnect the event hub or app will hang
    }
}