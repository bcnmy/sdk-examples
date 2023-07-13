const { ethers } = require("ethers");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const SmartAccount = require("@biconomy/smart-account").default;
const { ChainId, Environments } = require("@biconomy/core-types");
const config = require("../config.json");

const mintErc20 = async (amount) => {
  let provider = new HDWalletProvider(config.privateKey, config.rpcUrl);
  const walletProvider = new ethers.providers.Web3Provider(provider);
  // create SmartAccount instance
  const wallet = new SmartAccount(walletProvider, {
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

  const erc20Interface = new ethers.utils.Interface([
    'function mint(address _to, uint256 _amount)'
  ])
  const amountGwei = ethers.utils.parseUnits(amount.toString(), 18);
  const data = erc20Interface.encodeFunctionData(
    'mint', [smartAccount.address, amountGwei]
  )
  const erc20Address = "0x43Eb7ebe789BC8a749Be41089a963D7e68759a6A" // same for goerli and mumbai
  const tx = {
    to: erc20Address,
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
  const txResponse = await smartAccount.sendTransaction({ transaction: tx });
  console.log('Tx Response', txResponse);
  const txReciept = await txResponse.wait();
  console.log('Tx hash', txReciept.transactionHash);
}

module.exports = { mintErc20 };