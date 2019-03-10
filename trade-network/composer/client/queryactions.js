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

    displayResources(resources) {
        if (resources) {
            console.log('result set length=', resources.length);
        }
        for(const resource of resources) {
            console.log(this.serializer.toJSON(resource));
        }
    }

    async run() {
        console.log('\n\n\n------- QUERY ACTIONS START --------')
        const resources = await this.bizNetworkConnection.query('selectCommodities');
        this.displayResources(resources);

        // TODO: Maybe do other queries ?

        // TODO: Need to handle dynamic queries, buildQuery then perform the query.

        console.log('------- QUERY ACTIONS END --------\n\n\n')
    }
}

module.exports = TxActions;
