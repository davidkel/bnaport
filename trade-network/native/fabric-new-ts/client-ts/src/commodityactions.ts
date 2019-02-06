import {Contract, Network} from 'fabric-network';
import {Commodity, Namespace} from '../../model/trade-model';

export class CommodityActions {

    network: Network;
    contract: Contract;

    constructor(network: Network) {
        this.network = network;
        this.contract = network.getContract('demo');
    }

    displayResource(resource: string): void {
        console.log(JSON.parse(resource));
    }

    async createCommodity(tradingSymbol: string, description: string, mainExchange: string, quantity: number, owner: string): Promise<void> {
        const commodity: Commodity = {
            tradingSymbol,
            description,
            mainExchange,
            quantity,
            owner
        }

        let exists: Buffer = await this.contract.evaluateTransaction('CRUDCommodity', JSON.stringify(commodity), 'e');

        if (!exists.length) {
            await this.contract.submitTransaction('CRUDCommodity', JSON.stringify(commodity), 'c');
            console.log('commodity added');
        } else {
            console.log('trader exists, updating...');
            await this.contract.submitTransaction('CRUDCommodity', JSON.stringify(commodity), 'u');
            console.log('commodity added');
        }
        console.log('commodity details retrieved');
        const res: Buffer = await this.contract.evaluateTransaction('CRUDCommodity', JSON.stringify(commodity), 'r');
        this.displayResource(res.toString('utf8'));
    }


    async run(): Promise<void> {
        console.log('\n\n\n------- COMMODITY ACTIONS START --------')

        // create a Commodity
        this.createCommodity('C1', 'Some commodities', 'NASDAQ', 2582, `resource:${Namespace}.Trader#T1`);

        // do full CRUD on a commodity
        const tempCommodity: Commodity = {
            tradingSymbol: 'TempCom',
            mainExchange: 'NASDAQ',
            description: 'temporary commodities',
            quantity: 611,
            owner: `resource:${Namespace}.Trader#T1`
        }

        await this.contract.submitTransaction('CRUDCommodity', JSON.stringify(tempCommodity), 'c');
        console.log('Temp commodity details');
        let res: Buffer = await this.contract.evaluateTransaction('CRUDCommodity', JSON.stringify(tempCommodity), 'r');
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