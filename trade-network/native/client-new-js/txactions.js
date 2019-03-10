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
const ChaincodeEventEmitter = require('./chaincodeeventemitter');

class TxActions {

    constructor(network, contractName, mspid) {
        this.network = network;
        this.contractName = contractName;
        this.mspid = mspid;
        this.contract = network.getContract(contractName);
    }

    displayResources(resourcesStr) {
        const resources = JSON.parse(resourcesStr);
        if (resources) {
            console.log('result set length=', resources.length);
        }
        for(const resource of resources) {
            console.log(resource);
        }
    }

    async run() {
        console.log('\n\n\n------- TX ACTIONS START --------')
        const namespace = 'org.example.trading';

        const trade = {
            commodityId: 'C1',
            newOwnerId: 'T2'
        }

        // contrived way to wait until the event has been received.
        let eventReceived, eventError;
        let eventPromise = new Promise((resolve, reject) => {
            eventReceived = resolve;
            eventError = reject;
        })

        const chaincodeEventEmitter = new ChaincodeEventEmitter(this.network, this.mspid, this.contractName);
        await chaincodeEventEmitter.initialize();
        chaincodeEventEmitter.on('ChaincodeEvent', async (event) => {
            console.log(event);
            const resolvedOwner = await this.contract.evaluateTransaction('resolveResource', event.commodity.owner, 'Participant');
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
            console.log('------- TX ACTIONS END --------\n\n\n')
        } catch(err) {
            console.log(err);
        } finally {
            chaincodeEventEmitter.destroy();
        }
    }
}

module.exports = TxActions;
