'use strict';

import Client = require('fabric-client');
import CAClient = require('fabric-ca-client');
import {Wallet, Gateway, X509WalletMixin, Identity} from 'fabric-network';

/**
 * This class provides a simple way to interact with the fabric-ca server
 * to register new users for enrolment as well as enrol a user directly 
 * into a wallet.
 */
export class IdentityManager {

    client: Client;
    idService: CAClient.IdentityService;
    registrarWallet: Wallet;
    registrarLabel: string;
    ccp: any;
    gateway: Gateway;

    /**
     * initialize the identity manager
     * @param ccp the common connection profile being used
     * @param registrarWallet The wallet that contains or will contain the registrar identity
     * @param registrarLabel The label of the registrar identity in the wallet
     */
    initialize(ccp: any, registrarWallet: Wallet, registrarLabel: string) {
        this.registrarWallet = registrarWallet;
        this.registrarLabel = registrarLabel;
        this.ccp = ccp;
    }

    /**
     * Internal method to get a client with an ephemeral cryptosuite generator
     */
    async _getClient(): Promise<Client> {
        if (!this.client) {
            this.client = Client.loadFromConfig(this.ccp);
            const cryptoSuite: Client.ICryptoSuite = Client.newCryptoSuite();
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
    async _getGateway(): Promise<Gateway> {
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
    async _getIdService() : Promise<CAClient.IdentityService> {
        if (!this.idService) {
            const gateway: Gateway = await this._getGateway();
            this.idService = gateway.getClient().getCertificateAuthority().newIdentityService();
        }
        return this.idService;
    }

    /**
     * Check to see if the userid is registered to the fabric-ca server
     * @param userID the userid to check
     */
    async exists(userID: string): Promise<boolean> {
        const gateway: Gateway = await this._getGateway();
        const identity: Client.User = gateway.getCurrentIdentity();        
        try {
            const idService: CAClient.IdentityService = await this._getIdService();
            // annoyingly although the response has provision to provide the errors
            // returned, what actually happens here is that it throws an error if
            // the user doesn't exist. 
            const resp: CAClient.IServiceResponse = await idService.getOne(userID, identity);
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
    async registerUser(userID: string, secret?: string, options?: any): Promise<string> {
        if (!options) {
            options = {};
        }

        const registerRequest: CAClient.IRegisterRequest  = {
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
            registerRequest.attrs = registerRequest.attrs.concat(options.atttributes);            
        }

        const gateway: Gateway = await this._getGateway();
        const identity: Client.User = gateway.getCurrentIdentity();
        const idService: CAClient.IdentityService = await this._getIdService();
        const userSecret: string = await idService.create(registerRequest,identity);
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
    async enrollToWallet(userID: string, secret: string, mspId: string, walletToImportTo: Wallet, label: string): Promise<void> {
        const options: CAClient.IEnrollmentRequest = { enrollmentID: userID, enrollmentSecret: secret };
        const client: Client = await this._getClient();
        const enrollment: CAClient.IEnrollResponse = await client.getCertificateAuthority().enroll(options);
        const userIdentity: Identity = X509WalletMixin.createIdentity(mspId, enrollment.certificate, enrollment.key.toBytes());
        await walletToImportTo.import(label, userIdentity);
    }

}