'use strict';

const Client = require('fabric-client');
const User = require('fabric-client/lib/User');

class IdentityManager {

    initialize(ccp, wallet, id) {
        this.client = Client.loadFromConfig(ccp);
        this.registrarWallet = wallet;
        this.registrarId = id;        
    }

    getIdService() {
        if (!this.idService) {
            this.idService = this.client.getCertificateAuthority().newIdentityService();  // TODO: cache
        }
        return this.idService;
    }

    async exists(userID) {
        const identity = await (this.registrarWallet).setUserContext(this.client, this.registrarId);
        try {
            // are you kidding, this throws an error, why ???? couldn't you just pass the response back as
            // empty and also populate the response as described in the API ?
            const resp = await this.getIdService().getOne(userID, identity);
            return true;
        } catch(err) {
            return false;
        }
    }    

    async registerUser(userID, secret, options) {
        if (!options) {
            options = {};
        }
        const identity = await (this.registrarWallet).setUserContext(this.client, this.registrarId);

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

        const userSecret = await this.getIdService().create(registerRequest, identity);
        return userSecret;
    }

    async enrollToWallet(userID, secret, mspId, walletToImportTo, label) {
        await (walletToImportTo).configureClientStores(this.client, label);
        let options = { enrollmentID: userID, enrollmentSecret: secret };
        const enrollment = await this.client.getCertificateAuthority().enroll(options);
        // private key will now have been stored

        let user = new User(label);
        user.setCryptoSuite(this.client.getCryptoSuite());
        await user.setEnrollment(enrollment.key, enrollment.certificate, mspId);
        // public key will now have been stored
        await this.client.setUserContext(user);
        // state store will now have been saved

    }
}

module.exports = IdentityManager;