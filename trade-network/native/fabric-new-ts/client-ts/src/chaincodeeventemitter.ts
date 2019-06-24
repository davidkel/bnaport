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
import { ChaincodeEvent, Channel, ChannelPeer } from 'fabric-client';
import { Contract, ContractEventListener } from 'fabric-network';

/**
 * This class provides a simple way to register for chaincode events
 * and have them emitted through the event emitter capabilities of
 * node. This implementation does not provide any support for
 * 1. guaranteed delivery through event replay
 * 2. Any mechanism to recover from loss of connection to the event hub
 */
export class ChaincodeEventEmitter extends EventEmitter {

    private contract: Contract;

    /**
     * constructor
     * @param network The network instance from the gateway
     * @param mspid your organisations mspid
     * @param contractName the contractName (chaincodeid) for the events
     */
    constructor(contract: Contract) {
        super();
        this.contract = contract;
    }

    /**
     * initialize this chaincode event emitter by creating a channel event
     * hub and registering to listen for chaincode events.
     */
    public async initialize(): Promise<void> {
        this.contract.addContractListener('unique-id-1', 'trade-network',
            (err: Error, event: any, blkNum: string, txid: string, status: string): any => {
                console.log('event received', status, event , blkNum, txid);
                if (err) {
                    this.emit('error', err);
                } else if (status && status === 'VALID') {
                    // only if a valid block is committed should we emit an event
                    let evt = event.payload.toString('utf8');
                    evt = JSON.parse(evt);
                    if (Array.isArray(evt)) {
                        for(const oneEvent of evt) {
                            this.emit('ChaincodeEvent', oneEvent);
                        }
                    } else {
                        this.emit('ChaincodeEvent', evt);
                    }
                }
           }
        );
    }
}
