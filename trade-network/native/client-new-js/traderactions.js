class TraderActions {

    constructor(network, contract) {
        this.network = network;
        this.contract = contract;
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

        const exists = await this.contract.evaluateTransaction('existsTrader', traderID);

        if ((exists.toString() !== 'true')) {
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
        console.log('exists', (await this.contract.evaluateTransaction('CRUDTrader', JSON.stringify(tempTrader), 'e')).toString() === 'true');
        res = await this.contract.evaluateTransaction('CRUDTrader', JSON.stringify(tempTrader), 'r');
        this.displayResource(res.toString('utf8'));
        await this.contract.submitTransaction('CRUDTrader', JSON.stringify(tempTrader), 'd');
        console.log('Temp trader details');
        console.log('exists', (await this.contract.evaluateTransaction('CRUDTrader', JSON.stringify(tempTrader), 'e')).toString() === 'true');
        console.log('------- TRADER ACTIONS END --------\n\n\n')
    }
}

module.exports = TraderActions;
