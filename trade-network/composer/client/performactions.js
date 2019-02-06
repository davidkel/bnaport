'use strict';

const {BusinessNetworkConnection} = require('composer-client');
const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );
const EmbeddedDeploy = require('./embeddeddeploy'); 
const TraderActions = require('./traderactions');
const CommodityActions = require('./commodityactions');
const QueryActions = require('./queryactions');

const TxActions = require('./txactions');
const namespace = 'org.example.trading';

let bizNetworkConnection;


(async () => {

    // Specific to using the embedded connector
    const card = await EmbeddedDeploy(cardStore);
    bizNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });

    // Specific to a deployed business network
    // const bizNetworkConnection = new BusinessNetworkConnection();
    // const card = 'admin@trade-network';

    await bizNetworkConnection.connect(card);
    await (new TraderActions(bizNetworkConnection, namespace)).run();
    await (new CommodityActions(bizNetworkConnection, namespace)).run();
    await (new TxActions(bizNetworkConnection, namespace)).run();
    await (new QueryActions(bizNetworkConnection, namespace)).run();

    // disconnect
    bizNetworkConnection.disconnect();
})();