const { ethers } = require("ethers");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const SmartAccount = require("@biconomy/smart-account").default;
const { ChainId } = require("@biconomy/core-types");
const config = require("../config.json");

async function main() {
  let provider = new HDWalletProvider(config.privateKey, config.rpcUrl);
  const walletProvider = new ethers.providers.Web3Provider(provider);
  // create SmartAccount instance
  const wallet = new SmartAccount(walletProvider, {
    debug: false,
    activeNetworkId: config.chainId,
    supportedNetworksIds: [config.chainId],
    networkConfig: [
      {
        chainId: ChainId.POLYGON_MUMBAI,
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
  const recipientAddress = '0x0000000000000000000000000000000000000000'
  const amount = ethers.BigNumber.from("1000000")
  const usdcAddress = '0xdA5289fCAAF71d52a80A254da614a192b693e977'
  const data = erc20Interface.encodeFunctionData(
    'transfer', [recipientAddress, amount]
  )
  const tx = {
    to: usdcAddress,
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
  const txResponse = await smartAccount.sendGasLessTransaction({ transaction: tx });
  console.log('Transaction hash', txResponse.hash);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});