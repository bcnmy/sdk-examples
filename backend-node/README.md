### SmartAccount on backend using private key

This is a cli to demonstrate how to use a private key to sign transactions on the backend with new Biconomy SDK.

## Setup

```bash
yarn install
```

## Run

```bash
npm run smartAccount init --network=mumbai
npm run smartAccount transfer --to=0x1234567890123456789012345678901234567890 --amount=1
npm run smartAccount erc20Transfer --to=0x1234567890123456789012345678901234567890 --amount=10 --token=0x0987654321098765432109876543210987654321
npm run smartAccount mint
npm run smartAccount batchMint
```
