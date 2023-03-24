const { ethers } = require("ethers");
const chalk = require('chalk');
const HDWalletProvider = require("@truffle/hdwallet-provider");
const SmartAccount = require("@biconomy-sdk-dev/smart-account").default;
const { ChainId, Environments } = require("@biconomy-sdk-dev/core-types");
const config = require("../config.json");

async function getAddress() {
  let provider = new HDWalletProvider(config.privateKey, config.rpcUrl);
  const walletProvider = new ethers.providers.Web3Provider(provider);
  // get EOA address from wallet provider
  const eoa = await walletProvider.getSigner().getAddress();
  console.log(chalk.blue(`EOA address: ${eoa}`));

  // get SmartAccount address from wallet provider
  const wallet = new SmartAccount(walletProvider, {
    environment: Environments.QA,
    activeNetworkId: config.chainId,
    supportedNetworksIds: [ChainId.GOERLI, ChainId.POLYGON_MUMBAI],
  });
  const smartAccount = await wallet.init();
  const address = await smartAccount.getSmartAccountState();
  console.log(chalk.green(`SmartAccount address: ${address.address}`));
}

module.exports = { getAddress };