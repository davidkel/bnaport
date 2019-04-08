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
class TraderActions {

    constructor(network, contract) {
        this.network = network;
        this.contract = contract;
    }

    displayResource(resource) {
        console.log(JSON.parse(resource));
    }


    async createTrader(traderID, first, last) {
        const trader = {
            tradeId: traderID,
            firstName: first,
            lastName: last
        }

        const exists = await this.contract.evaluateTransaction('existsTrader', traderID);

        if ((exists.toString() !== 'true')) {
            await this.contract.submitTransaction('addTrader', JSON.stringify(trader));
            console.log('trader added');
        } else {
            console.log('trader exists');
        }
        console.log('trader details retrieved');
        const res = await this.contract.evaluateTransaction('getTrader', traderID);
        this.displayResource(res.toString('utf8'));
    }

    async run() {
        console.log('\n\n\n------- TRADER ACTIONS START --------')

        // create Traders
        await this.createTrader('T1', 'Fred', 'Bloggs');
        await this.createTrader('T2', 'John', 'Doe');
        await this.createTrader('T5', 'John', 'Doe');


        // Do Full CRUD on trader 3
        const tempTrader = {
            tradeId: 'TEMP',
            firstName: 'Joe',
            lastName: 'Bloggs'
        }
        const exists = await this.contract.evaluateTransaction('existsTrader', 'TEMP');
        console.log('TEMP', exists.toString());
        if ((exists.toString() === 'true')) {
            await this.contract.submitTransaction('deleteTrader', 'TEMP');
            console.log('Deleted TEMP trader');
        }

        await this.contract.submitTransaction('addTrader', JSON.stringify(tempTrader));
        console.log('Temp trader details');
        let res = await this.contract.evaluateTransaction('getTrader', 'TEMP');
        this.displayResource(res.toString('utf8'));
        tempTrader.lastName = 'Bond';
        await this.contract.submitTransaction('updateTrader', JSON.stringify(tempTrader));
        console.log('Temp trader details');
        console.log('exists', (await this.contract.evaluateTransaction('existsTrader', 'TEMP')).toString() === 'true');
        res = await this.contract.evaluateTransaction('getTrader', 'TEMP');
        this.displayResource(res.toString('utf8'));
        await this.contract.submitTransaction('deleteTrader', 'TEMP');
        console.log('Temp trader details');
        console.log('exists', (await this.contract.evaluateTransaction('existsTrader', 'TEMP')).toString() === 'true');
        console.log('------- TRADER ACTIONS END --------\n\n\n')
    }
}

module.exports = TraderActions;
