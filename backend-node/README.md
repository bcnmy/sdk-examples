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

yarn run smartAccount erc20Transfer --to=0x1234567890123456789012345678901234567890 --amount=0.01 --token=0x0987654321098765432109876543210987654321

# batch transfer x amount to n addresses separated by comma
yarn run smartAccount batchErc20Transfer --to 0x1234,0x1234,0x1234 --token 0x0987654321098765432109876543210987654321 --amount 0.01

yarn run smartAccount mint

yarn run smartAccount batchMint
```
