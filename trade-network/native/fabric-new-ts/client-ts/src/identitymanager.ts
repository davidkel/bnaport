'use strict';

import Client = require('fabric-client');
import CAClient = require('fabric-ca-client');
import {User, IIdentity} from 'fabric-client';
import {Wallet, Gateway, X509WalletMixin, Identity} from 'fabric-network';
const IdentityService = require('fabric-ca-client').IdentityService; 

export class IdentityManager {

    client: Client;
    idService: CAClient.IdentityService;
    registrarWallet: Wallet;
    registrarId: string;
    ccp: any;
    gateway: Gateway;

    initialize(ccp: any, wallet: Wallet, id: string) {
        this.registrarWallet = wallet;
        this.registrarId = id;
        this.ccp = ccp;
    }

    async _getClient(): Promise<Client> {
        if (!this.client) {
            this.client = Client.loadFromConfig(this.ccp);
            const cryptoSuite: Client.ICryptoSuite = Client.newCryptoSuite();
            cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore());
            this.client.setCryptoSuite(cryptoSuite);
        }
        return this.client;
    }

    async _getGateway(): Promise<Gateway> {
        if (!this.gateway) {
            this.gateway = new Gateway();
            await this.gateway.connect(this.ccp, {
                wallet: this.registrarWallet,
                identity: this.registrarId
            });
        }
        return this.gateway;
    }    

    async _getIdService() : Promise<CAClient.IdentityService> {
        if (!this.idService) {
            const gateway: Gateway = await this._getGateway();
            this.idService = gateway.getClient().getCertificateAuthority().newIdentityService();
        }
        return this.idService;
    }

    async exists(userID: string): Promise<boolean> {
        const gateway = await this._getGateway();
        const identity: Client.User = gateway.getCurrentIdentity();        
        try {
            // are you kidding, this throws an error, why ???? couldn't you just pass the response back as
            // empty and also populate the response as described in the API ?
            const idService: CAClient.IdentityService = await this._getIdService();
            const resp: CAClient.IServiceResponse = await idService.getOne(userID, identity);
            return true;
        } catch(err) {
            return false;
        }
    }

    
    async registerUser(userID: string, secret?: string, options?: any): Promise<string> {
        if (!options) {
            options = {};
        }

        let registerRequest: CAClient.IRegisterRequest  = {
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

        const gateway: Gateway = await this._getGateway();
        const identity: Client.User = gateway.getCurrentIdentity();
        const idService: CAClient.IdentityService = await this._getIdService();
        const userSecret: string = await idService.create(registerRequest,identity);
        return userSecret;
    }

    async enrollToWallet(userID: string, secret: string, mspId: string, walletToImportTo: Wallet, label: string): Promise<void> {
        let options: CAClient.IEnrollmentRequest = { enrollmentID: userID, enrollmentSecret: secret };
        const client: Client = await this._getClient();
        const enrollment: CAClient.IEnrollResponse = await client.getCertificateAuthority().enroll(options);
        const userIdentity: Identity = X509WalletMixin.createIdentity(mspId, enrollment.certificate, enrollment.key.toBytes());
        await walletToImportTo.import(label, userIdentity);
    }

}