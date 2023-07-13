const { ethers } = require("ethers");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const SmartAccount = require("@biconomy/smart-account").default;
const { ChainId, Environments } = require("@biconomy/core-types");
const config = require("../config.json");

const erc20Transfer = async (recipientAddress, amount, tokenAddress) => {
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

  // transfer ERC-20 tokens to recipient
  const erc20Interface = new ethers.utils.Interface([
    'function transfer(address _to, uint256 _value)'
  ])
  // Encode an ERC-20 token transfer to recipient of the specified amount
  const amountGwei = ethers.utils.parseUnits(amount.toString(), 18);
  const data = erc20Interface.encodeFunctionData(
    'transfer', [recipientAddress, amountGwei]
  )
  const tx = {
    to: tokenAddress,
    data
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
  const txResponse = await smartAccount.sendTransaction({ transaction: tx });
  console.log('Tx Response', txResponse);
  const txReciept = await txResponse.wait();
  console.log('Tx hash', txReciept.transactionHash);
}

module.exports = { erc20Transfer };