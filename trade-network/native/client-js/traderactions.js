class TraderActions {

    constructor(network) {
        this.network = network;
        this.contract = network.getContract('demo');
    }

    displayResource(resource) {
        console.log(JSON.parse(resource));
    }


    async createTrader(traderID, first, last) {
        const trader = {
            tradeId: traderID,
            firstName: first,
            lastName: last
        }

        //let exists = await this.contract.evaluateTransaction('existsTrader', JSON.stringify(trader));
        let exists = await this.contract.evaluateTransaction('CRUDTrader', JSON.stringify(trader), 'e');

        if (!exists.length) {
            await this.contract.submitTransaction('CRUDTrader', JSON.stringify(trader), 'c');
            console.log('trader added');
        } else {
            console.log('trader exists');
        }
        console.log('trader details retrieved');
        const res = await this.contract.evaluateTransaction('CRUDTrader', JSON.stringify(trader), 'r');
        this.displayResource(res.toString('utf8'));
    }

    async run() {
        console.log('\n\n\n------- TRADER ACTIONS START --------')

        // create Traders
        await this.createTrader('T1', 'Fred', 'Bloggs');
        await this.createTrader('T2', 'John', 'Doe');
        await this.createTrader('T5', 'John', 'Doe');

    
        // Do Full CRUD on trader 3
        const tempTrader = {
            tradeId: 'TEMP',
            firstName: 'Joe',
            lastName: 'Bloggs'
        }
        await this.contract.submitTransaction('CRUDTrader', JSON.stringify(tempTrader), 'c');
        console.log('Temp trader details');
        let res = await this.contract.evaluateTransaction('CRUDTrader', JSON.stringify(tempTrader), 'r');
        this.displayResource(res.toString('utf8'));
        tempTrader.lastName = 'Bond';
        await this.contract.submitTransaction('CRUDTrader', JSON.stringify(tempTrader), 'u');
        console.log('Temp trader details');
        console.log('exists', (await this.contract.evaluateTransaction('CRUDTrader', JSON.stringify(tempTrader), 'e')).length !== 0);
        res = await this.contract.evaluateTransaction('CRUDTrader', JSON.stringify(tempTrader), 'r');
        this.displayResource(res.toString('utf8'));
        await this.contract.submitTransaction('CRUDTrader', JSON.stringify(tempTrader), 'd');
        console.log('Temp trader details');
        console.log('exists', (await this.contract.evaluateTransaction('CRUDTrader', JSON.stringify(tempTrader), 'e')).length !== 0);
        console.log('------- TRADER ACTIONS END --------\n\n\n')
    }
}

module.exports = TraderActions;