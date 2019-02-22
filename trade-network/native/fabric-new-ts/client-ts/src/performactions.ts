// This is the main program to drive this contrived client
// run this script.

import {Contract, DiscoveryOptions, Gateway, InMemoryWallet, Network, X509WalletMixin, GatewayOptions} from 'fabric-network';
import * as fs from 'fs';
import {TraderActions} from './traderactions';
import {CommodityActions} from './commodityactions';
import {QueryActions} from './queryactions';
import {TxActions} from './txactions';
import {IdentityManager} from './identitymanager';

// the ccp file to use
const ccpFile: string = './ccp-single.json';

// define the organisation name we will represent 
const orgName: string = 'Org1';

// define the name, pw and wallet label of the ca registrar
const caRegistrar: string = 'admin';
const caRegistrarPW: string = 'adminpw';
const caRegistrarWalletLabel: string = 'CAAdmin@org1';

// define the name, pw and wallet lavel of the user to register (if not registered) and use.
const userName: string = 'david';
const userNamePW: string = 'davidpw';
const userNameWalletLabel: string = 'david@org1';

// define the channel/contract and discovery requirements
const channel: string = 'composerchannel';
const contractName: string = 'trade-network';
const useDiscovery: boolean = false;
const convertDiscoveredToLocalHost: boolean = null;

(async () => {
    // load the connection profile
    const buffer: Buffer = fs.readFileSync(ccpFile);
    const ccp: any = JSON.parse(buffer.toString());
    const mspid: string = ccp.organizations[orgName].mspid;

    // manage identities
    const inMemoryWallet: InMemoryWallet = new InMemoryWallet();
    const idManager: IdentityManager = new IdentityManager();

    // initialise the id manager to use the inMemory wallet and to specify the registar label
    // to use for registering users
    idManager.initialize(ccp, inMemoryWallet, caRegistrarWalletLabel);

    // enroll the register into the wallet, ensure it's label matches the one the id manager was
    // initialised with
    await idManager.enrollToWallet(caRegistrar, caRegistrarPW, mspid, inMemoryWallet, caRegistrarWalletLabel);

    // register a user if not already registered, allow infinite enrollment
    const userExists = await idManager.exists(userName);
    if (!userExists) {
        await idManager.registerUser(userName, userNamePW);
    }

    // enroll that user into a useable identity and store it in the wallet.
    await idManager.enrollToWallet(userName, userNamePW, mspid, inMemoryWallet, userNameWalletLabel);

/*    
    // example of loading existing crypto material into the in memory wallet
    const cert: string = fs.readFileSync('./myid/cert.pem').toString();
    const key: string = fs.readFileSync('./myid/key.pem').toString();
    await inMemoryWallet.import('myid@org1', X509WalletMixin.createIdentity(org1msp, cert, key));
    const exists: boolean = await inMemoryWallet.exists('myid@org1');
    console.log('myid stored in wallet:', exists);    
*/

    // create the gateway
    const gateway: Gateway = new Gateway();
    const discoveryOptions: DiscoveryOptions = {enabled: useDiscovery};
    if (useDiscovery && convertDiscoveredToLocalHost !== null) {
        discoveryOptions.asLocalhost = convertDiscoveredToLocalHost;
    }

	try {
		await gateway.connect(ccp, {
            wallet: inMemoryWallet,
            identity: userNameWalletLabel,
            discovery: discoveryOptions
		});

        // invoke the various different types of tasks.
        const network: Network = await gateway.getNetwork(channel);
        const contract: Contract = network.getContract(contractName);
        await (new TraderActions(network, contract).run());
        await (new CommodityActions(network, contract)).run();
        await (new TxActions(network, contractName, mspid)).run();
        await (new QueryActions(network, contract)).run();
	} catch(error) {
		console.log(error);
	} finally {
        gateway.disconnect();
		//process.exit(0);  // needed because using HSM causes app to hang at the end.
	}







})();