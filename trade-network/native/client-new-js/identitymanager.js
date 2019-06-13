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
'use strict';

const Client = require('fabric-client');
const {Gateway, X509WalletMixin} = require('fabric-network');

class IdentityManager {

    /**
     * initialize the identity manager
     * @param ccp the common connection profile being used
     * @param registrarWallet The wallet that contains or will contain the registrar identity
     * @param registrarLabel The label of the registrar identity in the wallet
     */
    initialize(ccp, registrarWallet, registrarLabel) {
        this.registrarWallet = registrarWallet;
        this.registrarLabel =   registrarLabel;
        this.ccp = ccp;
    }

    /**
     * Internal method to get a client with an ephemeral cryptosuite generator
     */
    async _getClient() {
        if (!this.client) {
            this.client = await Client.loadFromConfig(this.ccp);
            const cryptoSuite = Client.newCryptoSuite();
            cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore());
            this.client.setCryptoSuite(cryptoSuite);
        }
        return this.client;
    }

    /**
     * Internal method to get a gateway configured with the registrar information.
     * This is currently the only documented way to easily access the wallet contents
     * to get a user object for interaction with the fabric-ca-client apis.
     */
    async _getGateway() {
        if (!this.gateway) {
            this.gateway = new Gateway();
            await this.gateway.connect(this.ccp, {
                wallet: this.registrarWallet,
                identity: this.registrarLabel
            });
        }
        return this.gateway;
    }

    /**
     * Internal method to get the Identity Service
     */
    async _getIdService() {
        if (!this.idService) {
            const gateway = await this._getGateway();
            this.idService = gateway.getClient().getCertificateAuthority().newIdentityService();
        }
        return this.idService;
    }

    /**
     * Check to see if the userid is registered to the fabric-ca server
     * @param userID the userid to check
     */
    async exists(userID) {
        const gateway = await this._getGateway();
        const identity = gateway.getCurrentIdentity();
        try {
            const idService = await this._getIdService();
            // annoyingly although the response has provision to provide the errors
            // returned, what actually happens here is that it throws an error if
            // the user doesn't exist.
            const resp = await idService.getOne(userID, identity);
            return true;
        } catch(err) {
            // TODO: we currently assume that any error means it doesn't exist but it
            // could easily be another error
            return false;
        }
    }

    /**
     * register a user to the fabric ca server. This allows for some of the Composer options
     * but handles attributes differently as it wasn't flexible enough in composer. This will use the
     * registrar wallet and label for the request.
     * @param userID The userid to register
     * @param secret [optional] the secret to associate with the user
     * @param options [optional] extra options such as extended attributes or affiliation
     */
    async registerUser(userID, secret, options) {
        if (!options) {
            options = {};
        }

        const registerRequest = {
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

        if (options.attributes) {
            registerRequest.attrs = registerRequest.attrs.concat(options.attributes);
        }

        const gateway = await this._getGateway();
        const identity = gateway.getCurrentIdentity();
        const idService = await this._getIdService();
        const userSecret = await idService.create(registerRequest,identity);
	    console.log('user registered. secret=', userSecret);
        return userSecret;
    }

    /**
     * enroll a user to the provided wallet.
     * @param userID The userid to enroll
     * @param secret The secret of the userid
     * @param mspId the mspId of the user
     * @param walletToImportTo the wallet to import to
     * @param label the label to use for the identity in the wallet.
     */
    async enrollToWallet(userID, secret, mspId, walletToImportTo, label) {
        const options = { enrollmentID: userID, enrollmentSecret: secret };
        const client = await this._getClient();
        const enrollment = await client.getCertificateAuthority().enroll(options);
        console.log(userID, 'enrolled', enrollment);
        const userIdentity = X509WalletMixin.createIdentity(mspId, enrollment.certificate, enrollment.key.toBytes());
        await walletToImportTo.import(label, userIdentity);
    }
}

module.exports = IdentityManager;
