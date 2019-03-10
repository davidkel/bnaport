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
import {Contract, Network} from 'fabric-network';
import {Trader} from '../../model/trade-model';

export class TraderActions {

    private network: Network;
    private contract: Contract;

    constructor(network: Network, contract: Contract) {
        this.network = network;
        this.contract = contract;
    }

    /**
     * Helper method to display a resource
     * @param resource the resource
     */
    private displayResource(resource: string): void {
        console.log(JSON.parse(resource));
    }

    /**
     * Helper method to create if it doesn't exist
     * @param traderID traderID
     * @param first first name
     * @param last last name
     */
    private async createTrader(traderID: string, first: string, last: string): Promise<void> {
        const trader: Trader = {
            tradeId: traderID,
            firstName: first,
            lastName: last
        };

        // check to see if the trader exists
        const exists: Buffer = await this.contract.evaluateTransaction('existsTrader', traderID);

        // convert the string to a true boolean in the if statement.
        if (exists.toString() !== 'true') {
            // trader doesn't exist
            await this.contract.submitTransaction('addTrader', JSON.stringify(trader));
            console.log('trader added');
        } else {
            console.log('trader exists');
        }
        console.log('trader details retrieved');
        const res: Buffer = await this.contract.evaluateTransaction('getTrader', traderID);
        this.displayResource(res.toString('utf8'));
    }

    public async run(): Promise<void> {
        console.log('\n\n\n------- TRADER ACTIONS START --------');

        // create Traders
        await this.createTrader('T1', 'Fred', 'Bloggs');
        await this.createTrader('T2', 'John', 'Doe');
        await this.createTrader('T5', 'John', 'Doe');

        // Do Full CRUD on TEMP trader
        const tempTrader: Trader = {
            tradeId: 'TEMP',
            firstName: 'Joe',
            lastName: 'Bloggs'
        };

        // adding a trader so use submitTransaction
        await this.contract.submitTransaction('addTrader', JSON.stringify(tempTrader));
        console.log('Temp trader details');

        // getting the trader so use evaluateTransaction
        let res: Buffer = await this.contract.evaluateTransaction('getTrader', 'TEMP');
        this.displayResource(res.toString('utf8'));
        tempTrader.lastName = 'Bond';

        // updating the trader so use submitTransaction
        await this.contract.submitTransaction('updateTrader', JSON.stringify(tempTrader));
        console.log('Temp trader details');

        // checking existance so use evaluateTransaction
        console.log('exists', (await this.contract.evaluateTransaction('existsTrader', 'TEMP')).toString() === 'true');
        res = await this.contract.evaluateTransaction('getTrader', 'TEMP');
        this.displayResource(res.toString('utf8'));

        // delete the trader so use submitTransaction
        await this.contract.submitTransaction('deleteTrader', 'TEMP');
        console.log('Temp trader details');
        console.log('exists', (await this.contract.evaluateTransaction('existsTrader', 'TEMP')).toString() === 'true');
        console.log('------- TRADER ACTIONS END --------\n\n\n');
    }
}
