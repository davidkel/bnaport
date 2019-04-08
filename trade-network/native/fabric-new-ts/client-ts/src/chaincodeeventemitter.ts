/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {EventEmitter} from 'events';
import { ChaincodeEvent, Channel, ChannelPeer, RegistrationOpts, ChannelEventHub } from 'fabric-client';
import { Network } from 'fabric-network';

/**
 * This class provides a simple way to register for chaincode events
 * and have them emitted through the event emitter capabilities of
 * node. This implementation does not provide any support for
 * 1. guaranteed delivery through event replay
 * 2. Any mechanism to recover from loss of connection to the event hub
 */

 // THOUGHTS: How do you know the event comes from the transaction you submitted ?
 // you need to match the txID...
export class ChaincodeEventEmitter extends EventEmitter {

    private network: Network;
    private eventHub: any; // Bug ChannelEventHub not declared correctly;
    private handle: any; // Bug: not been exported ChaincodeChannelEventHandle
    private mspid: string;
    private contractName: string;
    private lastBlockNum: number;

    /**
     * constructor
     * @param network The network instance from the gateway
     * @param mspid your organisations mspid
     * @param contractName the contractName (chaincodeid) for the events
     */
    constructor(network: Network, mspid: string, contractName: string) {
        super();
        this.network = network;
        this.mspid = mspid;
        this.contractName = contractName;
        this.lastBlockNum = null;
    }

    /**
     * initialize this chaincode event emitter by creating a channel event
     * hub and registering to listen for chaincode events.
     */
    public async initialize(replayFrom?: number): Promise<void> {
        const channel: Channel = this.network.getChannel();
        const peers: ChannelPeer[] = channel.getPeersForOrg(this.mspid);

        //TODO: need an appropriate way to select a peer with HA support
        this.eventHub = channel.newChannelEventHub(peers[0].getPeer());

        // if we have a replay value then we must register before we connect.
        // this will fire events starting at the provided replayFrom block (ie it's inclusive)
        // the replay occurs as part of the connect request which is why you
        // have to register before connecting to ensure replay occurs.
        if (replayFrom !== undefined) {
            this.registerEventListener(replayFrom);
        }

        const waitToConnect: Promise<any> = new Promise((resolve, reject) => {
            // Bug: Callback not defined in typescript
            this.eventHub.connect(true, (err: Error, eventHub: ChannelEventHub) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
        try {
            await waitToConnect;
            console.log('----> CONNECTED <-----');

            // if no replay is required we need to register after we have connected
            // If we did this before connection then if the last block has any chaincode
            // events they could be re-emitted
            if (replayFrom === undefined) {
                this.registerEventListener();
            }
        } catch(err) {
            // TODO: need a way to handle trying another peer.
        }

    }

    /**
     * destroy this chaincode event emitter. You must call this when you
     * are no longer interested is receiving chaincode events otherwise your
     * application will hang on termination
     */
    public destroy(): void {
        this.eventHub.unregisterChaincodeEvent(this.handle);
        this.eventHub.disconnect();  // must disconnect the event hub or app will hang
    }

    private registerEventListener(replayFrom?: number) {
        let opts: RegistrationOpts;
        if (replayFrom !== undefined) {
            opts = {
                startBlock: replayFrom
            };
        }

        this.handle = this.eventHub.registerChaincodeEvent(this.contractName, 'trade-network',
            (event: ChaincodeEvent, blockNum: number, txID: string, status: string) => {
                if (status && status === 'VALID') {
                    const metadata = {
                        blockNum,
                        txID
                    };
                    let evt: any = event.payload.toString('utf8');
                    evt = JSON.parse(evt);
                    if (Array.isArray(evt)) {
                        for (const oneEvent of evt) {
                            oneEvent._blockNum = blockNum;
                            this.emit('ChaincodeEvent', {metadata, event: oneEvent});
                        }
                    } else {
                        evt._blockNum = blockNum;
                        this.emit('ChaincodeEvent', {metadata, event: evt});
                    }
                }
                // TODO: can we assume the app has now processed the event ?
                this.lastBlockNum = blockNum;
            },
            (err: Error) => {
                // Emit the error so the caller at least knows that the chaincode listener
                // probably has stopped working. Ideally some sort of recovery could be done
                // here on the event listener either try to reconnect or try a different peer
                this.emit('error', err);
                // TODO: recovery implementation could be as follows
                // 1. we need to disconnect the event hub and either reconnect with replay
                // from this.lastBlockSeen (question is has the client application processed it ?)
                // we would need the application to acknowledge the block as handled.
                // and then what happens if the the blocks are acknowledged in non ascending order ?
            },
            opts,
        );
    }
}
