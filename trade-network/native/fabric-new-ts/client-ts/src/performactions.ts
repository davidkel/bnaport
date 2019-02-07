import {Gateway, InMemoryWallet, Network, X509WalletMixin} from 'fabric-network';
import * as fs from 'fs';
import {TraderActions} from './traderactions';
import {CommodityActions} from './commodityactions';
import {QueryActions} from './queryactions';
import {TxActions} from './txactions';


(async () => {

    // load crypto material into the in memory wallet
    const inMemoryWallet: InMemoryWallet = new InMemoryWallet();
    const cert: string = fs.readFileSync('./dave/cert.pem').toString();
    const key: string = fs.readFileSync('./dave/key.pem').toString();
    // TODO: get mspid from ccp ?
    await inMemoryWallet.import('dave', X509WalletMixin.createIdentity('Org1MSP', cert, key));
    const exists: boolean = await inMemoryWallet.exists('dave');
    console.log('Dave exists:', exists);    

    // create the gateway
    const buffer: Buffer = fs.readFileSync('./ccp-single.json');

	let gateway: Gateway = new Gateway();

	try {
		await gateway.connect(JSON.parse(buffer.toString()), {
            wallet: inMemoryWallet,
            identity: 'dave',
            discovery: {enabled: false}
		});

        let network: Network = await gateway.getNetwork('composerchannel');
        await (new TraderActions(network).run());
        await (new CommodityActions(network)).run();
        await (new TxActions(network)).run();
        await (new QueryActions(network)).run();
	} catch(error) {
		console.log(error);
	} finally {
        gateway.disconnect();
		//process.exit(0);  // needed because using HSM causes app to hang at the end.
	}







})();