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
class TxActions {

    constructor(bizNetworkConnection, namespace) {
        this.bizNetworkConnection = bizNetworkConnection;
        this.factory = bizNetworkConnection.getBusinessNetwork().getFactory();
        this.serializer = bizNetworkConnection.getBusinessNetwork().getSerializer();
        this.namespace = namespace;
    }

    displayResource(resource) {
        console.log(this.serializer.toJSON(resource));
    }

    async run() {
        console.log('\n\n\n------- TX ACTIONS START --------')
        const trade = this.factory.newTransaction(this.namespace, 'Trade');
        trade.newOwner = this.factory.newRelationship(this.namespace, 'Trader', 'T2');
        trade.commodity = this.factory.newRelationship(this.namespace, 'Commodity', 'C1');

        // register for events from the business network
        let eventResolve;
        const eventPromise = new Promise((resolve, reject) => {
            eventResolve = resolve;
        });
        this.bizNetworkConnection.on('event', async (event) => {
            console.log(event);
            console.log( 'Received event: ' + event.getFullyQualifiedIdentifier() + ' for commodity ' + event.commodity.getIdentifier() );
            const reg = await this.bizNetworkConnection.getAssetRegistry(`${this.namespace}.Commodity`);
            const cc = await reg.resolve(event.commodity.getIdentifier())
            console.log('Commodity', cc);
            eventResolve();
        });
        await this.bizNetworkConnection.submitTransaction(trade);
        await eventPromise;

        // TODO: Need to handle remove option


        console.log('------- TX ACTIONS END --------\n\n\n')

    }
}

module.exports = TxActions;
