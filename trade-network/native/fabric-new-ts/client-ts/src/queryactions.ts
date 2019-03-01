import {Contract, Network} from 'fabric-network';
import {TraderClass} from '../../model/trade-model';

export class QueryActions {

    private network: Network;
    private contract: Contract;

    constructor(network: Network, contract: Contract) {
        this.network = network;
        this.contract = contract;
    }

    /**
     * Helper to display multiple resources in an array as a JSON string
     * @param resourcesStr the JSON String of an array of resources
     */
    private displayResources(resourcesStr: string): void {
        const resources: any[] = JSON.parse(resourcesStr);
        if (resources) {
            console.log('result set length=', resources.length);
        }
        for (const resource of resources) {
            console.log(resource);
        }
    }

    public async run(): Promise<void> {
        console.log('\n\n\n------- QUERY ACTIONS START --------');
        console.log('selectCommodities -->');

        // run the in built query selectCommodities so use evaluateTransaction
        let resources: Buffer = await this.contract.evaluateTransaction('runQuery', 'selectCommodities');
        this.displayResources(resources.toString('utf8'));

        // run a client determined mango query so use evaluateTransaction
        console.log('\n\ndynamic query -->');
        const myQuery: string = `{"selector":{"\\\\$class":"${TraderClass}"}}`;
        resources = await this.contract.evaluateTransaction('runDynamicQuery', myQuery);
        this.displayResources(resources.toString('utf8'));

        // get the history of the TEMP trader participant so use evaluateTransaction
        // This one was created, updated and deleted and the history will show this.
        // It may show this has been done multiple times depending on the number of
        // times the client has been run.
        console.log('\n\ntrader history -->');
        resources = await this.contract.evaluateTransaction('getTraderHistory', 'TEMP');
        this.displayResources(resources.toString('utf8'));

        // get the history of the TempCom commodity asset. so use evaluateTransaction
        // This one was created, updated and deleted and the history will show this.
        // It may show this has been done multiple times depending on the number of
        // times the client has been run.
        console.log('\n\ncommodity history -->');
        resources = await this.contract.evaluateTransaction('getCommodityHistory', 'TempCom');
        this.displayResources(resources.toString('utf8'));

        console.log('------- QUERY ACTIONS END --------\n\n\n');
    }
}
