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