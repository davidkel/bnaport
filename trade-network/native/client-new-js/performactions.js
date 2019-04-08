/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
const ccpFile = './connection.json';

// define the organisation name we will represent
const orgName = 'Org1';

// define the name, pw and wallet label of the ca registrar
const caRegistrar = 'admin';
const caRegistrarPW = 'adminpw';
const caRegistrarWalletLabel = 'CAAdmin@org1';

// define the name, pw and wallet lavel of the user to register (if not registered) and use.
const userName = 'alex';
const userNamePW = 'alexpw';
const userNameWalletLabel = 'alex@org1';

// define the channel/contract and discovery requirements
const channel = 'mychannel';
const contractName = 'mycc';
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
        //await (new CommodityActions(network, contract)).run();
        //await (new TxActions(network, contractName, mspid)).run();
        //await (new QueryActions(network, contract)).run();
	} catch(error) {
		console.log(error);
	} finally {
        gateway.disconnect();
		//process.exit(0);  // needed because using HSM causes app to hang at the end.
	}







})();
