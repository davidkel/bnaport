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
import {Commodity, TraderClass} from '../../model/trade-model';

export class CommodityActions {

    private network: Network;
    private contract: Contract;

    constructor(network: Network, contract: Contract) {
        this.network = network;
        this.contract = contract;
    }

    public async run(): Promise<void> {
        console.log('\n\n\n------- COMMODITY ACTIONS START --------');

        // ensure a Commodity called C1 exists with the required values so add or update as required
        this.createCommodity('C1', 'Some commodities', 'NASDAQ', 2582, `resource:${TraderClass}#T1`);

        // do full CRUD on a commodity
        const tempCommodity: Commodity = {
            tradingSymbol: 'TempCom',
            mainExchange: 'NASDAQ',
            description: 'temporary commodities',
            quantity: 611,
            owner: `resource:${TraderClass}#T1`
        };

        // add the commodity so it's a submitTransaction
        await this.contract.submitTransaction('addCommodity', JSON.stringify(tempCommodity));
        console.log('Temp commodity details');

        // get the commodity so it's an evaluateTransaction
        let res: Buffer = await this.contract.evaluateTransaction('getCommodity', 'TempCom');
        this.displayResource(res.toString('utf8'));

        // update the commodity so it's a submitTransaction
        tempCommodity.mainExchange = 'LSE';
        await this.contract.submitTransaction('updateCommodity', JSON.stringify(tempCommodity));
        console.log('Temp commodity details');

        // confirm the commodity still exists so it's an evaluateTransaction
        console.log('exists', (await this.contract.evaluateTransaction('existsCommodity', 'TempCom')).toString() === 'true');

        // get the updated commodity so it's an evaluateTransaction
        res = await this.contract.evaluateTransaction('getCommodity', 'TempCom');
        this.displayResource(res.toString('utf8'));

        // delete the commodity so it's a submitTransaction
        await this.contract.submitTransaction('deleteCommodity', 'TempCom');

        // confirm the commodity doesn't exist so evaluateTransaction
        console.log('exists', (await this.contract.evaluateTransaction('existsCommodity', 'TempCom')).toString() === 'true');
        console.log('------- COMMODITY ACTIONS END --------\n\n\n');
    }

    /**
     * display a resource
     * @param resource the resource to display
     */
    private displayResource(resource: string): void {
        console.log(JSON.parse(resource));
    }

    /**
     * helper to create or update a commodity
     * @param tradingSymbol tradingSymbol
     * @param description description
     * @param mainExchange mainExchange
     * @param quantity quantity
     * @param owner owner in form of resource://
     */
    private async createCommodity(tradingSymbol: string, description: string, mainExchange: string, quantity: number, owner: string): Promise<void> {
        const commodity: Commodity = {
            tradingSymbol,
            description,
            mainExchange,
            quantity,
            owner
        };

        // see if the commodity exists
        const exists: Buffer = await this.contract.evaluateTransaction('existsCommodity', tradingSymbol);

        if ((exists.toString() !== 'true')) {
            // commodity doesn't exist
            await this.contract.submitTransaction('addCommodity', JSON.stringify(commodity));
            console.log('commodity added');
        } else {
            // commodity exists, so update it
            console.log('commodity exists, updating...');
            await this.contract.submitTransaction('updateCommodity', JSON.stringify(commodity));
            console.log('commodity added');
        }
        // display the current commodity
        console.log('commodity details retrieved');
        const res: Buffer = await this.contract.evaluateTransaction('getCommodity', tradingSymbol);
        this.displayResource(res.toString('utf8'));
    }
}
