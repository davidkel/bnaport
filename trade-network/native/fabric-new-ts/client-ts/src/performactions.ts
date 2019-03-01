// This is the main program to drive this contrived client
// run this script.

import {Contract, DiscoveryOptions, Gateway, InMemoryWallet, Network } from 'fabric-network';
import * as fs from 'fs';
import {CommodityActions} from './commodityactions';
import {IdentityManager} from './identitymanager';
import {QueryActions} from './queryactions';
import {TraderActions} from './traderactions';
import {TxActions} from './txactions';

// the ccp file to use
const ccpFile: string = './ccp-discovery.json';

// define the organisation name we will represent
const orgName: string = 'Org1';

// define the name, pw and wallet label of the ca registrar
const caRegistrar: string = 'admin';
const caRegistrarPW: string = 'adminpw';
const caRegistrarWalletLabel: string = 'CAAdmin@org1';

// define the name, pw and wallet lavel of the user to register (if not registered) and use.
const userName: string = 'alex';
const userNamePW: string = 'alexpw';
const userNameWalletLabel: string = 'alex@org1';

// define the channel/contract and discovery requirements
const channelName: string = 'mychannel';
const chaincodeId: string = 'trade-network';
const useDiscovery: boolean = true;
const convertDiscoveredToLocalHost: boolean = true;

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
        // register a user with the ability to access the trade-network contract
        await idManager.registerUser(userName, userNamePW, {attributes: [
            {
                name: 'trade-network',
                value: 'allow',
                ecert: true
            }
        ]});
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

    // create the gateway. Gateways are tied to the identity specified when
    // connected and can multiplex requests, so you only need 1 gateway per
    // unique identity. Also gateways are meant to be long lived, you don't
    // connect a gateway use it for a single request then disconnect it. That
    // approach would not be a good pattern.
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

        // get a network object from the channel name
        const network: Network = await gateway.getNetwork(channelName);

        // get the contract from the chaincode id.
        const contract: Contract = network.getContract(chaincodeId);

        // run the various tasks to test the contract
        await (new TraderActions(network, contract).run());
        await (new CommodityActions(network, contract)).run();
        await (new TxActions(network, chaincodeId, mspid)).run();
        await (new QueryActions(network, contract)).run();
    } catch (error) {
        console.log(error);
    } finally {
        // must always disconnect the gateway before you application terminates
        gateway.disconnect();
        // process.exit(0);  // needed because using HSM causes app to hang at the end.
    }
})();
