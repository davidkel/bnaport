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

    constructor(bizNetworkConnection, namespace) {
        this.bizNetworkConnection = bizNetworkConnection;
        this.factory = bizNetworkConnection.getBusinessNetwork().getFactory();
        this.serializer = bizNetworkConnection.getBusinessNetwork().getSerializer();
        this.namespace = namespace;
    }

    displayResource(resource) {
        console.log(this.serializer.toJSON(resource));
    }


    async createTrader(traderID, first, last) {
        const traderRegistry = await this.bizNetworkConnection.getParticipantRegistry(this.namespace + '.Trader');
        let exists = await traderRegistry.exists(traderID);
        if (!exists) {
            const trader = this.factory.newResource(this.namespace, 'Trader', traderID);
            trader.firstName = first;
            trader.lastName = last;
            await traderRegistry.add(trader);
            console.log('trader added');
            console.log('trader details retrieved');
            this.displayResource(await traderRegistry.get(traderID));
        } else {
            console.log('trader exists');
            console.log('trader details retrieved');
            this.displayResource(await traderRegistry.get(traderID));
        }
    }

    async run() {
        console.log('\n\n\n------- TRADER ACTIONS START --------')

        // create 2 Traders
        await this.createTrader('T1', 'Fred', 'Bloggs');
        await this.createTrader('T2', 'John', 'Doe');
        const traderRegistry = await this.bizNetworkConnection.getParticipantRegistry(this.namespace + '.Trader');

        // Do Full CRUD on trader 3
        const tempTrader = this.factory.newResource(this.namespace, 'Trader', 'TEMP');
        tempTrader.firstName = 'Joe';
        tempTrader.lastName = 'Bloggs';
        await traderRegistry.add(tempTrader);
        console.log('Temp trader details');
        this.displayResource(await traderRegistry.get('TEMP'));
        tempTrader.lastName = 'Bond';
        await traderRegistry.update(tempTrader);
        console.log('Temp trader details');
        console.log('exists', await traderRegistry.exists('TEMP'));
        this.displayResource(await traderRegistry.get('TEMP'));
        await traderRegistry.remove('TEMP');
        console.log('Temp trader details');
        console.log('exists', await traderRegistry.exists('TEMP'));
        console.log('------- TRADER ACTIONS END --------\n\n\n')

    }
}

module.exports = TraderActions;
