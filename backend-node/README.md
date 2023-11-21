### SmartAccount on backend using private key

This is a cli to demonstrate how to use a private key to sign transactions on the backend with new Biconomy SDK.
To enable logging export below flag
export BICONOMY_SDK_DEBUG=true

Set numOfParallelUserOps in config to the desired number if you want to execute parallel userOps

## Setup

```bash
yarn install
```

## Run

```bash
yarn run smartAccount --help
yarn run smartAccount init --network=mumbai
# get scw address

# update the correct privateKey, biconomyPaymasterUrl, rpcUrl and bundlerUrl in config.json
yarn run smartAccount address


## Gasless - Sponsorship Paymaster

yarn run smartAccount mint --mode=SPONSORED

## ERC20 - Token Paymaster

yarn run smartAccount mint --mode=ERC20

## No Paymaster

yarn run smartAccount mint


```
