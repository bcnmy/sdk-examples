### SmartAccount on backend using private key

This is a cli to demonstrate how to use a private key to sign transactions on the backend with new Biconomy SDK.

## Setup

```bash
yarn install
```

## Run

```bash

yarn run smartAccount init --network=mumbai

yarn run smartAccount transfer --to=0x1234567890123456789012345678901234567890 --amount=0.01
yarn run smartAccount erc20Transfer --to=0x1234567890123456789012345678901234567890 --amount=0.1 --token=0xdA5289fCAAF71d52a80A254da614a192b693e977
yarn run smartAccount mint
yarn run smartAccount batchMint
yarn run smartAccount mintWithBtpm
```
