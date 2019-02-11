import {Gateway, InMemoryWallet, Network, X509WalletMixin} from 'fabric-network';
import * as fs from 'fs';
import {TraderActions} from './traderactions';
import {CommodityActions} from './commodityactions';
import {QueryActions} from './queryactions';
import {TxActions} from './txactions';
import {IdentityManager} from './identitymanager';

// the ccp file to use
const ccpFile = './ccp-single.json';

// define the organisation name we will represent 
const orgName = 'Org1';

// define the name, pw and wallet label of the ca registrar
const caRegistrar = 'admin';
const caRegistrarPW = 'adminpw';
const caRegistrarWalletLabel = 'CAAdmin@org1';

// define the name, pw and wallet lavel of the user to register (if not registered) and use.
const userName = 'david';
const userNamePW = 'davidpw';
const userNameWalletLabel = 'david@org1';

(async () => {
    // load the connection profile
    const buffer: Buffer = fs.readFileSync(ccpFile);
    const ccp = JSON.parse(buffer.toString());
    const mspid = ccp.organizations[orgName].mspid;

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
	let gateway: Gateway = new Gateway();

	try {
		await gateway.connect(ccp, {
            wallet: inMemoryWallet,
            identity: userNameWalletLabel,
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