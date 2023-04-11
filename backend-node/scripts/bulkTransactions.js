const HDWalletProvider = require("@truffle/hdwallet-provider");
const { ethers, Wallet, utils } = require("ethers");
const SmartAccount = require("@biconomy/smart-account").default;
const { ChainId, Environments } = require("@biconomy/core-types");
const config = require("../config.json");

const txHashs = [];
const bulkTransactions = async (n) => {
  for (let i = 0; i < n; ++i) {
    const hashs = doTx()
    txHashs.push(hashs)
  }
  // promise resolve all txHashs
  Promise.all(txHashs).then((values) => {
    console.log("values", values);
  });
}

const doTx = async () => {
  const privateKey = Wallet.fromMnemonic(
    utils.entropyToMnemonic(utils.randomBytes(32))
  ).mnemonic.phrase;
  let provider = new HDWalletProvider(privateKey, config.rpcUrl);
  const walletProvider = new ethers.providers.Web3Provider(provider);
  // create SmartAccount instance
  const wallet = new SmartAccount(walletProvider, {
    environment: Environments.QA,
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

  const nftInterface = new ethers.utils.Interface([
    'function safeMint(address _to)'
  ])
  const data = nftInterface.encodeFunctionData(
    'safeMint', [smartAccount.address]
  )
  const nftAddress = "0xdd526eba63ef200ed95f0f0fb8993fe3e20a23d0" // same for goerli, mumbai, polygon
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
  console.log('Tx Response', txResponse);
  const txReciept = await txResponse.wait();
  return txReciept.transactionHash;
}

module.exports = { bulkTransactions };