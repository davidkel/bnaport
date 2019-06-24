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
import { Contract, Network } from 'fabric-network';
import { CommodityEvent, Trade } from '../../model/trade-model';
import {ChaincodeEventEmitter} from './chaincodeeventemitter';

export class TxActions {
    private network: Network;
    private contract: Contract;
    private contractName: string;
    private mspid: string;

    constructor(network: Network, contractName: string, mspid: string) {
        this.network = network;
        this.contractName = contractName;
        this.mspid = mspid;
        this.contract = network.getContract(contractName);
    }

    private displayResources(resourcesStr: string) {
        const resources: any[] = JSON.parse(resourcesStr);
        if (resources) {
            console.log('result set length=', resources.length);
        }
        for (const resource of resources) {
            console.log(resource);
        }
    }

    public async run(): Promise<void> {
        console.log('\n\n\n------- TX ACTIONS START --------');

        const trade: Trade = {
            commodityId: 'C1',
            newOwnerId: 'T2'
        };

        // contrived way to wait until the event has been received.
        let eventReceived: any;
        let eventError: any;
        const eventPromise: Promise<any> = new Promise((resolve, reject) => {
            eventReceived = resolve;
            eventError = reject;
        });

        const chaincodeEventEmitter: ChaincodeEventEmitter = new ChaincodeEventEmitter(this.contract);
        await chaincodeEventEmitter.initialize();
        chaincodeEventEmitter.on('ChaincodeEvent', async (event: CommodityEvent) => {
            console.log('Event Received:');
            console.log(event);
            const resolvedOwner: Buffer = await this.contract.evaluateTransaction('resolveResource', event.commodity.owner, 'Participant');
            event.commodity.owner = JSON.parse(resolvedOwner.toString('utf8'));
            console.log('Final Commodity--->');
            console.log(event.commodity);
            eventReceived();
        });

        chaincodeEventEmitter.on('error', (err) => {
            eventError(err);
        });

        // send transaction
        try {
            await this.contract.submitTransaction('tradeCommodity', JSON.stringify(trade));
            await eventPromise;
            console.log('------- TX ACTIONS END --------\n\n\n');
        } catch (err) {
            console.log(err);
        } finally {
            // contract listeners will be removed when the gateway is disconnected
        }
    }
}
