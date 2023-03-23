const { ethers } = require("ethers");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const SmartAccount = require("@biconomy-sdk-dev/smart-account").default;
const { ChainId } = require("@biconomy-sdk-dev/core-types");
const config = require("../config.json");

const nativeTransfer = async (to, amount) => {
  let provider = new HDWalletProvider(config.privateKey, config.rpcUrl);
  const walletProvider = new ethers.providers.Web3Provider(provider);
  // create SmartAccount instance
  const wallet = new SmartAccount(walletProvider, {
    debug: false,
    environment: 'STAGING',
    activeNetworkId: config.chainId,
    backendUrl: 'https://sdk-backend.test.biconomy.io/v1/',
    relayerUrl: 'https://sdk-relayer.test.biconomy.io/api/v1/relay',
    activeNetworkId: config.chainId,
    supportedNetworksIds: [ChainId.GOERLI, ChainId.POLYGON_MUMBAI],
    networkConfig: [
      {
        chainId: config.chainId,
        dappAPIKey: config.dappAPIKey,
      }
    ]
  });
  const smartAccount = await wallet.init();
  // transfer native asset
  const tx = {
    to: to || "0x0000000000000000000000000000000000000000",
    data: "0x",
    value: ethers.utils.parseEther(amount.toString()),
  }
  // Transaction events subscription
  smartAccount.on('txHashGenerated', (response) => {
    console.log('txHashGenerated event received via emitter', response);
  });
  smartAccount.on('txMined', (response) => {
    console.log('txMined event received via emitter', response);
  });
  smartAccount.on('error', (response) => {
    console.log('error event received via emitter', response);
  });
  // Sending transaction
  const txResponse = await smartAccount.sendGaslessTransaction({ transaction: tx });
  console.log('Transaction hash', txResponse.hash);
}

module.exports = { nativeTransfer };