### SmartAccount on backend using private key

This is a cli to demonstrate how to use a private key to sign transactions on the backend with new Biconomy SDK.

## Setup

```bash
yarn install
```

## Run

```bash
yarn run smartAccount init --network=mumbai

yarn run smartAccount transfer --to=0x1234567890123456789012345678901234567890 --amount=1

yarn run smartAccount mintErc20 --amount 100

yarn run smartAccount erc20Transfer --to=0x1234567890123456789012345678901234567890 --amount 10 --token=0x43Eb7ebe789BC8a749Be41089a963D7e68759a6A

# batch transfer x amount to n addresses separated by comma
yarn run smartAccount batchErc20Transfer --to 0x1234,0x1234,0x1234 --token 0x43Eb7ebe789BC8a749Be41089a963D7e68759a6A --amount 2

# bulk transactions on n addresses, deploy and mint nft
yarn run smartAccount bulkTx -n 20

yarn run smartAccount mint

yarn run smartAccount batchMint
```
