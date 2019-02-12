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
        let resources = await this.contract.evaluateTransaction('runQuery', 'selectCommodities');
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