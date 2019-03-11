# bnaport
Example of porting a simple Composer BNA to Native Fabric 1.4.0

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

The fabric-old-js is provided only as a comparision on how this might have been done prior to the new contract support and may not be as upto date in capability as the fabric-new-ts contract implementation.


### fabric-network
A hyperledger fabric network that can be used to run the native chaincode (either in development mode or non development mode). 

## Running the Typescript examples

### initial setup
If you haven't done so already you need to install typescript and optionally tslint into your global npm modules
- npm install -g typescript
- npm install -g tslint

### prepare the contract 
- change to the native/fabric-new-ts/contract directory
- run `npm install` to install the dependent node modules
- run `npm run build` to compile the typescript to javascript

### prepare the client app
- change to the native/fabric-new-ts/client-ts directory
- run `npm install` to install the dependent node modules
- run `npm run build` to compile the typescript to javascript

### set up a running fabric with the contract
Now you need to deploy the contract to a running fabric. There are many ways this could be done. The option presented here will create a simple fabric running in development mode and start the contract however it can only be run on linux, it will not run on MacOS or Windows.
- change to the fabric-network directory
- run `./s2n.sh`

### run the client app
To run the client app to verify all is working
- change to the native/fabric-new-ts/client-ts directory
- run `node dist/client-ts/src/performactions.js`

You can also try the pure javascript client as well, first ensure you have all the dependent npm modules installed
- change to the native/client-new-js directory
- run `npm install`

You can then run the client
- run `node performactions.js`

# Using VS Code with IBM Blockchain Platform Extension
IBM has made available an extension to VS Code called IBM Blockchain Platform which you can use to run and test the new contract. You can download the extension from the VS Code market place. 

A description on using the extension with this sample can be found [here](./VSCode.md)
