import {Contract, Network} from 'fabric-network';
import {Trader} from '../../model/trade-model';

export class TraderActions {

    private network: Network;
    private contract: Contract;

    constructor(network: Network, contract: Contract) {
        this.network = network;
        this.contract = contract;
    }

    private displayResource(resource: string): void {
        console.log(JSON.parse(resource));
    }

    private async createTrader(traderID: string, first: string, last: string): Promise<void> {
        const trader: Trader = {
            tradeId: traderID,
            firstName: first,
            lastName: last
        };

        const exists: Buffer = await this.contract.evaluateTransaction('existsTrader', traderID);

        if (!exists.length) {
            await this.contract.submitTransaction('addTrader', JSON.stringify(trader));
            console.log('trader added');
        } else {
            console.log('trader exists');
        }
        console.log('trader details retrieved');
        const res: Buffer = await this.contract.evaluateTransaction('getTrader', traderID);
        this.displayResource(res.toString('utf8'));
    }

    public async run(): Promise<void> {
        console.log('\n\n\n------- TRADER ACTIONS START --------');

        // create Traders
        await this.createTrader('T1', 'Fred', 'Bloggs');
        await this.createTrader('T2', 'John', 'Doe');
        await this.createTrader('T5', 'John', 'Doe');

        // Do Full CRUD on TEMP trader
        const tempTrader: Trader = {
            tradeId: 'TEMP',
            firstName: 'Joe',
            lastName: 'Bloggs'
        };

        await this.contract.submitTransaction('addTrader', JSON.stringify(tempTrader));
        console.log('Temp trader details');
        let res: Buffer = await this.contract.evaluateTransaction('getTrader', 'TEMP');
        this.displayResource(res.toString('utf8'));
        tempTrader.lastName = 'Bond';
        await this.contract.submitTransaction('updateTrader', JSON.stringify(tempTrader));
        console.log('Temp trader details');
        console.log('exists', (await this.contract.evaluateTransaction('existsTrader', 'TEMP')).length !== 0);
        res = await this.contract.evaluateTransaction('getTrader', 'TEMP');
        this.displayResource(res.toString('utf8'));
        await this.contract.submitTransaction('deleteTrader', 'TEMP');
        console.log('Temp trader details');
        console.log('exists', (await this.contract.evaluateTransaction('existsTrader', 'TEMP')).length !== 0);
        console.log('------- TRADER ACTIONS END --------\n\n\n');
    }
}
