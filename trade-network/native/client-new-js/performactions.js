// This is the main program to drive this contrived client
// run this script.

const {Gateway, Network, Channel, Contract, InMemoryWallet, X509WalletMixin} = require('fabric-network');
const fs = require('fs');

const TraderActions = require('./traderactions');
const CommodityActions = require('./commodityactions');
const QueryActions = require('./queryactions');
const TxActions = require('./txactions');
const IdentityManager = require('./identitymanager');

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

// define the channel/contract and discovery requirements
const channel = 'mychannel';
const contractName = 'trade-network';
const useDiscovery = false;
const convertDiscoveredToLocalHost = null;

(async () => {
    // load the connection profile
    const buffer = fs.readFileSync(ccpFile);
    const ccp = JSON.parse(buffer.toString());
    const mspid = ccp.organizations[orgName].mspid;

    // manage identities
    const inMemoryWallet = new InMemoryWallet();
    const idManager = new IdentityManager();

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

    // create the gateway
    const gateway = new Gateway();
    const discoveryOptions = {enabled: useDiscovery};
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
        const network = await gateway.getNetwork(channel);
        const contract = network.getContract(contractName);
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