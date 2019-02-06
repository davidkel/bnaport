const {BusinessNetworkConnection} = require('composer-client');
const {AdminConnection} = require('composer-admin');
const { BusinessNetworkDefinition, CertificateUtil, IdCard } = require('composer-common');
const path = require('path');


async function embeddeddeploy(cardStore) {
    let adminConnection;
    let businessNetworkConnection;

    // Embedded connection used for local testing
    const connectionProfile = {
        name: 'embedded',
        'x-type': 'embedded'
    };
    // Generate certificates for use with the embedded connection
    const credentials = CertificateUtil.generate({ commonName: 'admin' });

    // PeerAdmin identity used with the admin connection to deploy business networks
    const deployerMetadata = {
        version: 1,
        userName: 'PeerAdmin',
        roles: [ 'PeerAdmin', 'ChannelAdmin' ]
    };
    const deployerCard = new IdCard(deployerMetadata, connectionProfile);
    deployerCard.setCredentials(credentials);

    const deployerCardName = 'PeerAdmin';
    adminConnection = new AdminConnection({ cardStore: cardStore });

    await adminConnection.importCard(deployerCardName, deployerCard);
    await adminConnection.connect(deployerCardName);

    businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });

    const adminUserName = 'admin';
    let adminCardName;
    const  businessNetworkDefinition = await BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '../business-network'));

    // Install the Composer runtime for the new business network
    await adminConnection.install(businessNetworkDefinition);
    console.log('business network installed');

    // Start the business network and configure an network admin identity
    const startOptions = {
        networkAdmins: [
            {
                userName: adminUserName,
                enrollmentSecret: 'adminpw'
            }
        ]
    };
    const adminCards = await adminConnection.start(businessNetworkDefinition.getName(), businessNetworkDefinition.getVersion(), startOptions);
    console.log('business network started');

    // Import the network admin identity for us to use
    adminCardName = `${adminUserName}@${businessNetworkDefinition.getName()}`;
    await adminConnection.importCard(adminCardName, adminCards.get(adminUserName));
    console.log(adminCardName);
    return adminCardName;
}

module.exports = embeddeddeploy;