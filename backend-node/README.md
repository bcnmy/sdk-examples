### SmartAccount on backend using private key

This is a cli to demonstrate how to use a private key to sign transactions on the backend with new Biconomy SDK.

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

yarn run smartAccount mint
yarn run smartAccount batchMint

# replace the receiver below
yarn run smartAccount transfer --to=0x1234567890123456789012345678901234567890 --amount=0.001

# replace the token address and receiver below
yarn run smartAccount erc20Transfer --to=0x1234567890123456789012345678901234567890 --amount=0.1 --token=0xdA5289fCAAF71d52a80A254da614a192b693e977

## ERC20 - Token Paymaster

yarn run smartAccount mint --mode=TOKEN
yarn run smartAccount batchMint --mode=TOKEN

# replace the receiver below
yarn run smartAccount transfer --to=0x1234567890123456789012345678901234567890 --amount=0.001 --mode=TOKEN

# replace the token address and receiver below
yarn run smartAccount erc20Transfer --to=0x1234567890123456789012345678901234567890 --amount=0.1 --token=0xdA5289fCAAF71d52a80A254da614a192b693e977 --mode=TOKEN


```
