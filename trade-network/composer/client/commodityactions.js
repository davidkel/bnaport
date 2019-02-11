class CommodityActions {

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
        console.log('\n\n\n------- COMMODITY ACTIONS START --------')

        // create a Commodity
        const commodityRegistry = await this.bizNetworkConnection.getAssetRegistry(this.namespace + '.Commodity');
        let exists = await commodityRegistry.exists('C1');
        if (!exists) {
            const commodity = this.factory.newResource(this.namespace, 'Commodity', 'C1');
            commodity.description = 'Some commodities';
            commodity.mainExchange = 'NASDAQ';
            commodity.quantity = 2582;
            commodity.owner = this.factory.newRelationship(this.namespace, 'Trader', 'T1');
            await commodityRegistry.add(commodity);
            console.log('commodity added');
            console.log('commodity details retrieved');
            this.displayResource(await commodityRegistry.get('C1'));
        } else {
            console.log('commodity exists');
            console.log('commodity details retrieved');
            this.displayResource(await commodityRegistry.get('C1'));
        }

        // Do Full CRUD on commodity 2
        const tempCommodity = this.factory.newResource(this.namespace, 'Commodity', 'TempCom');
        tempCommodity.description = 'temporary commodities';
        tempCommodity.mainExchange = 'NASDAQ';
        tempCommodity.quantity = 611;
        tempCommodity.owner = this.factory.newRelationship(this.namespace, 'Trader', 'T1');
        await commodityRegistry.add(tempCommodity);
        console.log('commodity details retrieved');
        this.displayResource(await commodityRegistry.get('TempCom'));
        tempCommodity.mainExchange = 'LSE';
        await commodityRegistry.update(tempCommodity);
        console.log('commodity details retrieved');
        console.log('exists', await commodityRegistry.exists('TempCom'));
        this.displayResource(await commodityRegistry.get('TempCom'));
        await commodityRegistry.remove('TempCom')
        console.log('commodity details retrieved');
        console.log('exists', await commodityRegistry.exists('TempCom'));        

        console.log('------- COMMODITY ACTIONS END --------\n\n\n')
 
    }
}

module.exports = CommodityActions;