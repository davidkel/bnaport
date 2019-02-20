import {ChaincodeEventEmitter} from './chaincodeeventemitter';
import { Network, Contract } from 'fabric-network';
import { Trade } from '../../model/trade-model';

export class TxActions {
    network: Network;
    contract: Contract;
    contractName: string;
    mspid: string;

    constructor(network: Network, contractName: string, mspid: string) {
        this.network = network;
        this.contractName = contractName;
        this.mspid = mspid;
        this.contract = network.getContract(contractName);
    }

    displayResources(resourcesStr: string) {
        const resources: any[] = JSON.parse(resourcesStr);
        if (resources) {
            console.log('result set length=', resources.length);
        }
        for (const resource of resources) {
            console.log(resource);
        }
    }

    async run(): Promise<void> {
        console.log('\n\n\n------- TX ACTIONS START --------')

        const trade: Trade = {
            commodityId: 'C1',
            newOwnerId: 'T2'
        }

        // contrived way to wait until the event has been received.
        let eventReceived, eventError;
        const eventPromise: Promise<any> = new Promise((resolve, reject) => {
            eventReceived = resolve;
            eventError = reject;
        })

        const chaincodeEventEmitter: ChaincodeEventEmitter = new ChaincodeEventEmitter(this.network, this.mspid, this.contractName);
        await chaincodeEventEmitter.initialize();
        chaincodeEventEmitter.on('ChaincodeEvent', async (event) => {
            console.log(event);
            const resolvedOwner: Buffer = await this.contract.evaluateTransaction('resolveResource', event.commodity.owner, 'Participant');
            event.commodity.owner = JSON.parse(resolvedOwner.toString('utf8'));
            console.log('Final Commodity--->');
            console.log(event.commodity);
            eventReceived();
        });

        chaincodeEventEmitter.on('error', (err) => {
            eventError(err);
        });

        // send transaction
        try {
            await this.contract.submitTransaction('tradeCommodity', JSON.stringify(trade));
            await eventPromise;
            console.log('------- TX ACTIONS END --------\n\n\n')
        } catch(err) {
            console.log(err);
        } finally {
            chaincodeEventEmitter.destroy();
        }
    }    
}