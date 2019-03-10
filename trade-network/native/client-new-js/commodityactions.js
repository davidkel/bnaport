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
class CommodityActions {

    constructor(network, contract) {
        this.network = network;
        this.contract = contract;
        this.namespace = 'org.example.trading';
    }

    displayResource(resource) {
        console.log(JSON.parse(resource));
    }

    async createCommodity(tradingSymbol, description, mainExchange, quantity, owner) {
        const commodity = {
            tradingSymbol,
            description,
            mainExchange,
            quantity,
            owner
        }

        const exists = await this.contract.evaluateTransaction('CRUDCommodity', JSON.stringify(commodity), 'e');

        if ((exists.toString() !== 'true')) {
            await this.contract.submitTransaction('CRUDCommodity', JSON.stringify(commodity), 'c');
            console.log('commodity added');
        } else {
            console.log('trader exists, updating...');
            await this.contract.submitTransaction('CRUDCommodity', JSON.stringify(commodity), 'u');
            console.log('commodity added');
        }
        console.log('commodity details retrieved');
        const res = await this.contract.evaluateTransaction('CRUDCommodity', JSON.stringify(commodity), 'r');
        this.displayResource(res.toString('utf8'));
    }


    async run() {
        console.log('\n\n\n------- COMMODITY ACTIONS START --------')

        // create a Commodity
        this.createCommodity('C1', 'Some commodities', 'NASDAQ', 2582, `resource:${this.namespace}.Trader#T1`);

        // do full CRUD on a commodity
        const tempCommodity = {
            tradingSymbol: 'TempCom'
        }
        tempCommodity.description = 'temporary commodities';
        tempCommodity.mainExchange = 'NASDAQ';
        tempCommodity.quantity = 611;
        tempCommodity.owner = `resource:${this.namespace}.Trader#T1`;

        await this.contract.submitTransaction('CRUDCommodity', JSON.stringify(tempCommodity), 'c');
        console.log('Temp commodity details');
        let res = await this.contract.evaluateTransaction('CRUDCommodity', JSON.stringify(tempCommodity), 'r');
        this.displayResource(res.toString('utf8'));
        tempCommodity.mainExchange = 'LSE';
        await this.contract.submitTransaction('CRUDCommodity', JSON.stringify(tempCommodity), 'u');
        console.log('Temp commodity details');
        console.log('exists', (await this.contract.evaluateTransaction('CRUDCommodity', JSON.stringify(tempCommodity), 'e')).toString() === 'true');
        res = await this.contract.evaluateTransaction('CRUDCommodity', JSON.stringify(tempCommodity), 'r');
        this.displayResource(res.toString('utf8'));
        await this.contract.submitTransaction('CRUDCommodity', JSON.stringify(tempCommodity), 'd');
        console.log('Temp commodity details');
        console.log('exists', (await this.contract.evaluateTransaction('CRUDCommodity', JSON.stringify(tempCommodity), 'e')).toString() === 'true');
        console.log('------- COMMODITY ACTIONS END --------\n\n\n')
    }
}

module.exports = CommodityActions;
