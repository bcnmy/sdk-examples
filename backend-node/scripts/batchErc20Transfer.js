const { ethers } = require("ethers");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const SmartAccount = require("@biconomy/smart-account").default;
const { ChainId, Environments } = require("@biconomy/core-types");
const config = require("../config.json");

const batchErc20Transfer = async (recipientAddress, amount, tokenAddress) => {
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
  console.log("transfering tokens to", recipientAddress);
  // create tx array to all the recipientAddress
  const txArray = [];
  for (let i = 0; i < recipientAddress.length; i++) {
    const tx = {
      to: tokenAddress,
      data: erc20Interface.encodeFunctionData(
        'transfer', [recipientAddress[i], amountGwei]
      )
    }
    txArray.push(tx);
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
  const txResponse = await smartAccount.sendTransactionBatch({ transactions: txArray });
  console.log('Tx Response', txResponse);
  const txReciept = await txResponse.wait();
  console.log('Tx hash', txReciept.transactionHash);
}

module.exports = { batchErc20Transfer };