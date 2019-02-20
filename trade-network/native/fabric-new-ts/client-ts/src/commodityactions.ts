import {Contract, Network} from 'fabric-network';
import {Commodity, TraderClass} from '../../model/trade-model';

export class CommodityActions {

    network: Network;
    contract: Contract;

    constructor(network: Network, contract: Contract) {
        this.network = network;
        this.contract = contract;
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

        const exists: Buffer = await this.contract.evaluateTransaction('existsCommodity', tradingSymbol);

        if (!exists.length) {
            await this.contract.submitTransaction('addCommodity', JSON.stringify(commodity));
            console.log('commodity added');
        } else {
            console.log('trader exists, updating...');
            await this.contract.submitTransaction('updateCommodity', JSON.stringify(commodity));
            console.log('commodity added');
        }
        console.log('commodity details retrieved');
        const res: Buffer = await this.contract.evaluateTransaction('getCommodity', tradingSymbol);
        this.displayResource(res.toString('utf8'));
    }


    async run(): Promise<void> {
        console.log('\n\n\n------- COMMODITY ACTIONS START --------')

        // create a Commodity
        this.createCommodity('C1', 'Some commodities', 'NASDAQ', 2582, `resource:${TraderClass}#T1`);

        // do full CRUD on a commodity
        const tempCommodity: Commodity = {
            tradingSymbol: 'TempCom',
            mainExchange: 'NASDAQ',
            description: 'temporary commodities',
            quantity: 611,
            owner: `resource:${TraderClass}#T1`
        }

        await this.contract.submitTransaction('addCommodity', JSON.stringify(tempCommodity));
        console.log('Temp commodity details');
        let res: Buffer = await this.contract.evaluateTransaction('getCommodity', 'TempCom');
        this.displayResource(res.toString('utf8'));
        tempCommodity.mainExchange = 'LSE';
        await this.contract.submitTransaction('updateCommodity', JSON.stringify(tempCommodity));
        console.log('Temp commodity details');
        console.log('exists', (await this.contract.evaluateTransaction('existsCommodity', 'TempCom')).length !== 0);
        res = await this.contract.evaluateTransaction('getCommodity', 'TempCom');
        this.displayResource(res.toString('utf8'));
        await this.contract.submitTransaction('deleteCommodity', 'TempCom');
        console.log('Temp commodity details');
        console.log('exists', (await this.contract.evaluateTransaction('existsCommodity', 'TempCom')).length !== 0);
        console.log('------- COMMODITY ACTIONS END --------\n\n\n')
    }
}