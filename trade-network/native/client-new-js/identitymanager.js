'use strict';

const Client = require('fabric-client');
const {Gateway, X509WalletMixin} = require('fabric-network');

class IdentityManager {

    initialize(ccp, wallet, id) {
        this.wallet = wallet;
        this.registrarId = id;  
        this.ccp = ccp;      
    }

    async getClient() {
        if (!this.client) {
            this.client = Client.loadFromConfig(this.ccp);
            const cryptoSuite = Client.newCryptoSuite();
            cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore());
            this.client.setCryptoSuite(cryptoSuite);
        }
        return this.client;
    }

    async getGateway() {
        if (!this.gateway) {
            this.gateway = new Gateway();
            await this.gateway.connect(this.ccp, {
                wallet: this.wallet,
                identity: this.registrarId
            });
        }
        return this.gateway;
    }

    async getIdService() {
        if (!this.idService) {
            const gateway = await this.getGateway();
            this.idService = gateway.getClient().getCertificateAuthority().newIdentityService();
        }
        return this.idService;
    }

    async exists(userID) {
        const gateway = await this.getGateway();
        const identity = gateway.getCurrentIdentity();
        try {
            // are you kidding, this throws an error, why ???? couldn't you just pass the response back as
            // empty and also populate the response as described in the API ?
            const idService = await this.getIdService();
            const resp = await idService.getOne(userID, identity);
            return true;
        } catch(err) {
            return false;
        }
    }    

    async registerUser(userID, secret, options) {
        if (!options) {
            options = {};
        }

        let registerRequest = {
            enrollmentID: userID,
            affiliation: options.affiliation || 'org1',  // or eg. org1.department1
            attrs: [],
            maxEnrollments: options.maxEnrollments || -1,  // infinite enrollment by default
            role: options.role || 'client',
            enrollmentSecret: secret
        };

        if (options.issuer) {
            // Everyone we create can register clients.
            registerRequest.attrs.push({
                name: 'hf.Registrar.Roles',
                value: 'client'
            });

            // Everyone we create can register clients that can register clients.
            registerRequest.attrs.push({
                name: 'hf.Registrar.Attributes',
                value: 'hf.Registrar.Roles, hf.Registrar.Attributes'
            });
        }

        let idAttributes = options.attributes;
        if (typeof idAttributes === 'string') {
            try {
                idAttributes = JSON.parse(idAttributes);
            } catch(error) {
                const newError = new Error('attributes provided are not valid JSON. ' + error);
                throw newError;
            }
        }

        for (let attribute in idAttributes) {
            registerRequest.attrs.push({
                name: attribute,
                value: idAttributes[attribute]
            });
        }
        const gateway = await this.getGateway();
        const identity = gateway.getCurrentIdentity();
        const idService = await this.getIdService();
        const userSecret = await idService.create(registerRequest,identity);
        return userSecret;
    }

    async enrollToWallet(userID, secret, mspId, walletToImportTo, label) {
        let options = { enrollmentID: userID, enrollmentSecret: secret };  
        const client = await this.getClient();      
        const enrollment = await client.getCertificateAuthority().enroll(options);
        const userIdentity = X509WalletMixin.createIdentity(mspId, enrollment.certificate, enrollment.key.toBytes());
        await walletToImportTo.import(label, userIdentity);
    }
}

module.exports = IdentityManager;