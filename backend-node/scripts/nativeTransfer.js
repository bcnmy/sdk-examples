const { ethers } = require("ethers");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const SmartAccount = require("@biconomy-devx/smart-account").default;
const { ChainId, Environments } = require("@biconomy-devx/core-types");
const config = require("../config.json");
const abi = require("./abi.json");

const nativeTransfer = async (to, amount) => {
  let provider = new HDWalletProvider(config.privateKey, config.rpcUrl);
  const walletProvider = new ethers.providers.Web3Provider(provider);
  const eoa = await walletProvider.getSigner().getAddress();
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
  console.log('EOA address: ', eoa)
  console.log('SmartAccount address: ', smartAccount.address);
  const scwContract = new ethers.Contract(smartAccount.address, abi, walletProvider);

  const amountGwei = ethers.utils.parseUnits(amount.toString(), 18);

  // SCW executeCall_s1m
  const scwData = await scwContract.populateTransaction.executeCall_s1m(to, amountGwei, "0x");
  const tx = {
    to: smartAccount.address,
    data: scwData.data,
    from: eoa
  }
  console.log(tx)
  const txResponse = await walletProvider.send('eth_sendTransaction', [tx]);
  console.log('executeCall tx', txResponse);

  // SCW pullTokens
  // const scwTransferData = await scwContract.populateTransaction.transfer(to, amountGwei);
  // const TransferTx = {
  //   to: smartAccount.address,
  //   data: scwTransferData.data,
  //   from: eoa
  // }
  // console.log(TransferTx)
  // const TransferTxResponse = await walletProvider.send('eth_sendTransaction', [TransferTx]);
  // console.log('Transfer tx', TransferTxResponse);
}

module.exports = { nativeTransfer };