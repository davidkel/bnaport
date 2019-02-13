# bnaport
Example of porting a simple Composer BNA to Native Fabric 1.4

## Directory structure

### composer
The contains a composer business network along with a contrived client application that just starts and drives some of the capability of the business network then terminates. You can run this without a real fabric as it uses the embedded-connector to simulate a state store for the composer runtime.

| directory | description |
| --------- | ----------- |
| business-network | The trade-network business network |
| client | A contrived client application that drives the various capabilities of the network |
| OrgComposerindexes | Original indexes that would have been included |

### native
This directory contains a native fabric implementation of the business network and client application. There are 2 things it doesn't try to provide an implementation of
1. ACLs
2. Historian

| directory | description |
| --------- | ----------- |
| client-new-js | An implementation of the client using the new programming model in javascript |
| fabric-new-ts | An implementation of the business network and client using the new programming models in typescript |
| fabric-old-js | An implementation of the business network not using the contract api (ie would work prior to 1.4) |

## fabric-network
A hyperledger fabric network that can be used to run the native chaincode (either in development mode or non development mode)

