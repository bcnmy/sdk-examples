## SDK by Example

This repository contains a set of examples that demonstrate how to use the Biconomy SDk smart-account to build decentralised applications. The SmartAccount package generates a smart wallet contract for each user EOA. It takes a provider, provider can be anything, here we have different examples of providers.

### Important Links

- [Biconomy Docs](https://docs.biconomy.io/sdk)
- [Contract Addresses](https://biconomy.gitbook.io/sdk/contracts/contract-addresses)

This is a cli to demonstrate how to use a private key to sign transactions on the backend with new Biconomy SDK.
To enable logging export below flag
export BICONOMY_SDK_DEBUG=true

Set numOfParallelUserOps in config to the desired number if you want to execute parallel userOps

## 1. Setup

```bash
yarn install
```

## 2. Edit your config.json file

Retrieve relevant bundlerUrl / paymaster api keys from the biconomy dashboard.

- [bundlerUrl](https://docs.biconomy.io/dashboard#bundler-url)
- [biconomyPaymasterApiKey](https://docs.biconomy.io/dashboard/paymaster)

## 3. Run

```bash
yarn run smartAccount --help
# get scw address

# update the correct privateKey, biconomyPaymasterUrl, rpcUrl and bundlerUrl in config.json
yarn run smartAccount address

## Gasless - Sponsorship Paymaster
yarn run smartAccount mint
yarn run smartAccount batchMint

## Gasless - Sponsorship Paymaster to send parallel userOps
yarn run smartAccount mint --mode=PARALLEL_USER_OPS

# replace the receiver below
yarn run smartAccount transfer --to=0x1234567890123456789012345678901234567890 --amount=0.001

# replace the token address and receiver below
yarn run smartAccount erc20Transfer --to=0x1234567890123456789012345678901234567890 --amount=0.1 --token=0xeaBc4b91d9375796AA4F69cC764A4aB509080A58

## ERC20 - Token Paymaster

yarn run smartAccount mint --mode=TOKEN
yarn run smartAccount batchMint --mode=TOKEN

## ERC20 - Token Paymaster to send parallel userOps

yarn run smartAccount mint --mode=TOKEN_PARALLEL_USER_OPS

# replace the receiver below
yarn run smartAccount transfer --to=0x1234567890123456789012345678901234567890 --amount=0.001 --mode=TOKEN

# replace the token address and receiver below
yarn run smartAccount erc20Transfer --to=0x2cf491602ad22944D9047282aBC00D3e52F56B37 --amount=0.1 --token=0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3 --mode=TOKEN
```
