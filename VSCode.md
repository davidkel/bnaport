# Using IBM Blockchain Extension to VSCode
Ensure you are running at least VSCode 1.31.1 and 0.3.1 of the IBM Blockchain Extension

## Setup
First clone this repo
```
git clone https://github.com/davidkel/bnaport
```

Start VSCode and select `open workspace file` and navigate to the `bnaport.code-workspace` file

(If you open the bnaport folder in VSCode it should prompt you to offer to open the workspace file as well)

## Packaging the Smart Contract

- Switch to the IBM Blockchain extension view. In the `SMART CONTRACT PACKAGES` frame press the `...` (More Actions) button and select `Package a Smart Contract Project`
(or from the command window CTRL-P/CMD-P type `>package smart` and select `IBM Blockchain Platform: Package a Smart Contract Project` )

- Select `contract` from the dropdown list

The package `trade-network@0.0.1` should now appear in the `SMART CONTRACT PACKAGES` list.

## Deploy the smart contract

- In the `LOCAL FABRIC OPS` view click the text `Local Fabric runtime is stopped. Click to start` to start a local fabric runtime.
- Install the smart contract 
  - Expand the `Installed` entry if it isn't already expanded (note it should be expanded by default)
  - click the `+ install` entry
  - choose `peer0.org1.example.com` from the drop down list (there will only be 1 entry)
  - select `trade-network@0.0.1` from the drop down list
- Instantiate the smart contract onto the channel `mychannel`
  - Expand the ` Instantiated` entry if it isn't already expanded (note it should be expanded by default)
  - click the `+ instantiate` entry
  - select `mychannel` from the drop down list
  - select `trade-network@0.0.1` from the drop down list
  - enter `instantiate` into the dialog box for the name of the function to run as part of the instantiate process
  - press enter again as no arguments are required

## Run the client
To run the client you need the connection profile for the fabric that is managed by vscode. 
- Expand the `Nodes` tree
- Right click on the `peer0.org1.example.com` entry under `Nodes`
- Select `Export Connection Details`
- Select `bnaport` as the folder to save the connection profile to
- return back to the file view of VS code
- Expand the `local_fabric` directory that exists under the `bnaport` directory
- move `connection.json` to the `native/fabric-new-ts/client-ts` folder
- open the file performactions.js in the `src` directory of the `client-ts` folder
- change the client to use the correct connection profile by finding and changing the line

```
const ccpFile: string = './ccp-single.json';
```
to
```
const ccpFile: string = './connection.json';
```
and saving the file

- right click `client-ts` and select `open in terminal`
- in the newly displayed terminal window, type `npm run build` to compile the typescript program.
- run the client program in the terminal window by typing
```
node dist/client-ts/src/performactions.js
```

## use the VSCode built in transaction runner
You need to ensure you have run the client at least once so that it has loaded some data into the blockchain.

This can run any of the declared functions in the smart contact but you need to ensure you get the parameters correct. This isn't so simple of a parameter is a complex JSON string or there are lots of parameters to pass at the moment, but as an example we will invoke a query to return some information as an example.
- return to the blockchain extension view
- In the `FABRIC GATEWAYS` connect and get the information about the local fabric by clicking on `Admin@org1.example.com`
- In the `Channels` entry there should be a child entry called `mychannel`. Click on this to expand it.
- click on `trade-network@0.0.1` to expand the contract. It will show a list of transactions that can be driven
- right click on `getTraderHistory` and select evaluateTransaction
- enter the value TEMP at the prompt
- The results should appear in the `OUTPUT` section. Ensure you have selected `Blockchain` from the dropdown menu to show the results.


