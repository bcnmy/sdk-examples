const { ethers } = require("ethers");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const SmartAccount = require("@biconomy/smart-account").default;
const config = require("../config.json");

async function main() {
  let provider = new HDWalletProvider(config.privateKey, config.rpcUrl);
  const walletProvider = new ethers.providers.Web3Provider(provider);
  // get EOA address from wallet provider
  const eoa = await walletProvider.getSigner().getAddress();
  console.log(`EOA address: ${eoa}`);

  // get SmartAccount address from wallet provider
  const wallet = new SmartAccount(walletProvider, {
    debug: false,
    activeNetworkId: 5,
    supportedNetworksIds: [5],
  });
  const smartAccount = await wallet.init();
  const address = await smartAccount.getSmartAccountState();
  console.log(`SmartAccount address: ${address.address}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});