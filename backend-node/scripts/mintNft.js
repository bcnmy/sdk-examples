const { ethers } = require("ethers");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const SmartAccount = require("@biconomy-sdk-dev/smart-account").default;
const { ChainId } = require("@biconomy-sdk-dev/core-types");
const config = require("../config.json");

const mintNft = async () => {
  let provider = new HDWalletProvider(config.privateKey, config.rpcUrl);
  const walletProvider = new ethers.providers.Web3Provider(provider);
  // create SmartAccount instance
  const wallet = new SmartAccount(walletProvider, {
    debug: false,
    activeNetworkId: config.chainId,
    backendUrl: 'https://sdk-backend.test.biconomy.io/v1',
    socketServerUrl: 'wss://sdk-testing-ws.staging.biconomy.io/connection/websocket',
    relayerUrl: 'https://sdk-relayer.staging.biconomy.io/api/v1/relay',
    bundlerUrl: 'https://sdk-relayer.test.biconomy.io/api/v1/relay',
    supportedNetworksIds: [ChainId.GOERLI, ChainId.POLYGON_MUMBAI],
    biconomySigningServiceUrl: 'https://paymaster-signing-service.staging.biconomy.io/api/v1/sign',
    networkConfig: [
      {
        chainId: config.chainId,
        dappAPIKey: config.dappAPIKey,
      }
    ]
  });
  const smartAccount = await wallet.init();

  const nftInterface = new ethers.utils.Interface([
    'function safeMint(address _to)'
  ])
  const data = nftInterface.encodeFunctionData(
    'safeMint', [smartAccount.address]
  )
  const nftAddress = "0xdd526eba63ef200ed95f0f0fb8993fe3e20a23d0" // same for goerli and mumbai
  const tx = {
    to: nftAddress,
    data: data,
  }
  // Transaction events subscription
  smartAccount.on('txHashGenerated', (response) => {
    console.log('txHashGenerated event received via emitter', response);
  });
  smartAccount.on('txMined', (response) => {
    console.log('txMined event received via emitter', response);
  });
  smartAccount.on('error', (response) => {
    console.log('error event received via emitter', JSON.stringify(response));
  });
  // Sending transaction
  const txResponse = await smartAccount.sendGaslessTransaction({ transaction: tx });
  console.log('Transaction hash', txResponse.hash);
}

module.exports = { mintNft };