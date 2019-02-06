const {Gateway, Network, Channel, Contract, InMemoryWallet, X509WalletMixin} = require('fabric-network');
const fs = require('fs');

const TraderActions = require('./traderactions');
const CommodityActions = require('./commodityactions');
const QueryActions = require('./queryactions');
const TxActions = require('./txactions');

(async () => {


    // load crypto material into the in memory wallet
    const inMemoryWallet = new InMemoryWallet();
    const cert = fs.readFileSync('./dave/cert.pem').toString();
    const key = fs.readFileSync('./dave/key.pem').toString();
    // TODO: get mspid from ccp ?
    await inMemoryWallet.import('dave', X509WalletMixin.createIdentity('Org1MSP', cert, key));
    const exists = await inMemoryWallet.exists('dave');
    console.log('Dave exists:', exists);    

    // create the gateway
    const buffer = fs.readFileSync('./ccp-single.json');

	let gateway = new Gateway();

	try {
		await gateway.connect(JSON.parse(buffer.toString()), {
            wallet: inMemoryWallet,
            identity: 'dave',
            discovery: {enabled: false}
		});

        let network = await gateway.getNetwork('composerchannel');
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