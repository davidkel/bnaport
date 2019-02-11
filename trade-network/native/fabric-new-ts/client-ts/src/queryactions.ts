import {Contract, Network} from 'fabric-network';
import {CommodityClass, Namespace, TraderClass} from '../../model/trade-model';

export class QueryActions {

    network: Network;
    contract: Contract;

    constructor(network: Network) {
        this.network = network;
        this.contract = network.getContract('demo');
    }

    displayResources(resourcesStr: string): void {
        const resources: any[] = JSON.parse(resourcesStr);
        if (resources) {
            console.log('result set length=', resources.length);
        }
        for(const resource of resources) {
            console.log(resource);
        }
    }

    async run(): Promise<void> {
        console.log('\n\n\n------- QUERY ACTIONS START --------')
        console.log('selectCommodities -->')

        let resources: Buffer = await this.contract.evaluateTransaction('runQuery', 'selectCommodities');
        this.displayResources(resources.toString('utf8'));

        console.log('\n\ndynamic query -->')
        const myQuery: string = `{"selector":{"\\\\$class":"${TraderClass}"}}`;
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