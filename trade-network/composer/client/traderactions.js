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