class QueryActions {

    constructor(network) {
        this.network = network;
        this.contract = network.getContract('demo');
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
        let resources = await this.contract.evaluateTransaction('runQuery', 'selectCommodities');
        this.displayResources(resources.toString('utf8'));
        console.log('------- QUERY ACTIONS END --------\n\n\n')

        const namespace = 'org.example.trading';
        const CommodityClass = namespace + '.Commodity';
        const TraderClass = namespace + '.Trader';

        const myQuery = `{"selector":{"\\\\$class":"${TraderClass}"}}`
        resources = await this.contract.evaluateTransaction('runDynamicQuery', myQuery);
        this.displayResources(resources.toString('utf8'));


    }    
}

module.exports = QueryActions;