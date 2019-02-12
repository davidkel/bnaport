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

        let exists = await this.contract.evaluateTransaction('CRUDCommodity', JSON.stringify(commodity), 'e');

        if (!exists.length) {
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
        console.log('exists', (await this.contract.evaluateTransaction('CRUDCommodity', JSON.stringify(tempCommodity), 'e')).length !== 0);
        res = await this.contract.evaluateTransaction('CRUDCommodity', JSON.stringify(tempCommodity), 'r');
        this.displayResource(res.toString('utf8'));
        await this.contract.submitTransaction('CRUDCommodity', JSON.stringify(tempCommodity), 'd');
        console.log('Temp commodity details');
        console.log('exists', (await this.contract.evaluateTransaction('CRUDCommodity', JSON.stringify(tempCommodity), 'e')).length !== 0);
        console.log('------- COMMODITY ACTIONS END --------\n\n\n')
    }
}

module.exports = CommodityActions;