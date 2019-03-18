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
class QueryActions {

    constructor(network, contract) {
        this.network = network;
        this.contract = contract;
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
        console.log('\n\n\n------- QUERY ACTIONS START --------')
        console.log('selectCommodities -->')
        let resources = await this.contract.evaluateTransaction('runQuery', 'selectCommodities', '');
        this.displayResources(resources.toString('utf8'));
        console.log('------- QUERY ACTIONS END --------\n\n\n')

        const namespace = 'org.example.trading';
        const CommodityClass = namespace + '.Commodity';
        const TraderClass = namespace + '.Trader';

        console.log('\n\ndynamic query -->')
        const myQuery = `{"selector":{"\\\\$class":"${TraderClass}"}}`
        resources = await this.contract.evaluateTransaction('runDynamicQuery', myQuery);
        this.displayResources(resources.toString('utf8'));

        console.log('\n\ntrader history -->')
        resources = await this.contract.evaluateTransaction('getTraderHistory', 'TEMP');
        this.displayResources(resources.toString('utf8'));

        console.log('\n\ncommodity history -->')
        resources = await this.contract.evaluateTransaction('getCommodityHistory', 'TempCom');
        this.displayResources(resources.toString('utf8'));

        console.log('------- QUERY ACTIONS END --------\n\n\n')
    }
}

module.exports = QueryActions;
