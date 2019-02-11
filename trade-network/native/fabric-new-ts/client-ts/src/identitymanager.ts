'use strict';

import Client = require('fabric-client');
import CAClient = require('fabric-ca-client');
import {User, IIdentity} from 'fabric-client';
import {Wallet} from 'fabric-network';
//import {IdentityService} from 'fabric-ca-client';  // BUG in TS
const IdentityService = require('fabric-ca-client').IdentityService; 



interface WalletWithSPI extends Wallet {
    setUserContext(client: Client, label: string) : Promise<Client.User>; 
    configureClientStores(client: Client, label: string): Promise<Client>;
}


export class IdentityManager {

    client: Client;
    idService: CAClient.IdentityService;
    registrarWallet: Wallet;
    registrarId: string;

    initialize(ccp: any, wallet: Wallet, id: string) {
        this.client = Client.loadFromConfig(ccp);
        this.registrarWallet = wallet;
        this.registrarId = id;
    }

    getIdService() : CAClient.IdentityService {
        if (!this.idService) {
            this.idService = this.client.getCertificateAuthority().newIdentityService();  // TODO: cache
        }
        return this.idService;
    }

    async exists(userID): Promise<boolean> {
        const identity: Client.User = await (<WalletWithSPI>this.registrarWallet).setUserContext(this.client, this.registrarId);
        try {
            // are you kidding, this throws an error, why ???? couldn't you just pass the response back as
            // empty and also populate the response as described in the API ?
            const resp: CAClient.IServiceResponse = await this.getIdService().getOne(userID, identity);
            return true;
        } catch(err) {
            return false;
        }
    }

    async registerUser(userID: string, secret?: string, options?: any): Promise<string> {
        if (!options) {
            options = {};
        }
        const identity: Client.User = await (<WalletWithSPI>this.registrarWallet).setUserContext(this.client, this.registrarId);

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

        const userSecret: string = await this.getIdService().create(registerRequest, identity);
        return userSecret;
    }

    async enrollToWallet(userID: string, secret: string, mspId: string, walletToImportTo: Wallet, label: string): Promise<void> {
        await (<WalletWithSPI>walletToImportTo).configureClientStores(this.client, label);
        let options: CAClient.IEnrollmentRequest = { enrollmentID: userID, enrollmentSecret: secret };
        const enrollment: CAClient.IEnrollResponse = await this.client.getCertificateAuthority().enroll(options);
        // private key will now have been stored

        let user: User = new User(label);
        user.setCryptoSuite(this.client.getCryptoSuite());
        await user.setEnrollment(enrollment.key, enrollment.certificate, mspId);
        // public key will now have been stored
        await this.client.setUserContext(user);
        // state store will now have been saved

    }

}