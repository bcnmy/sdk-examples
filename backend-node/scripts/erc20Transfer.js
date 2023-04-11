const { ethers } = require("ethers");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const SmartAccount = require("@biconomy-devx/smart-account").default;
const { ChainId, Environments } = require("@biconomy-devx/core-types");
const config = require("../config.json");
const abi = require("./abi.json");

const erc20Transfer = async (recipientAddress, amount, tokenAddress) => {
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

  // Encode an ERC-20 token transfer to recipient of the specified amount
  const erc20Interface = new ethers.utils.Interface([
    'function transfer(address _to, uint256 _value)'
  ])
  const amountGwei = ethers.utils.parseUnits(amount.toString(), 18);
  const erc20Data = erc20Interface.encodeFunctionData(
    'transfer', [recipientAddress, amountGwei]
  )
  // SCW executeCall
  const scwData = await scwContract.populateTransaction.executeCall(tokenAddress, 0, erc20Data);
  const tx = {
    to: smartAccount.address,
    data: scwData.data,
    from: eoa
  }
  console.log(tx)
  const txResponse = await walletProvider.send('eth_sendTransaction', [tx]);
  console.log('executeCall tx', txResponse);

  // const scwData = await scwContract.populateTransaction.executeCall("0x9a86A77C6db4289fd3930d531F5BDeFdD28411B6", 0, erc20Data);
  // const tx = {
  //   to: smartAccount.address,
  //   data: scwData.data,
  //   from: eoa
  // }
  // console.log(tx)
  // const txResponse = await walletProvider.send('eth_sendTransaction', [tx]);
  // console.log('executeCall tx', txResponse);

  // SCW pullTokens
  const scwPullTokensData = await scwContract.populateTransaction.pullTokens(tokenAddress, recipientAddress, amountGwei);
  const pullTokensTx = {
    to: smartAccount.address,
    data: scwPullTokensData.data,
    from: eoa
  }
  console.log(pullTokensTx)
  const pullTokensTxResponse = await walletProvider.send('eth_sendTransaction', [pullTokensTx]);
  console.log('pullTokens tx', pullTokensTxResponse);

  // SCW execTransaction_S6W
  const trx = {
    to: smartAccount.address,
    value: 0,
    data: erc20Data.data,
    operation: 0,
    targetTxGas: 300000,
  }
  const refunInfo = {
    baseGas: 0,
    gasPrice: 0,
    tokenGasPriceFactor: 1,
    gasToken: "0x0000000000000000000000000000000000000000",
    refundReceiver: "0x0000000000000000000000000000000000000000",
  }
  // const scwExecTransactionS6WData = await scwContract.populateTransaction.execTransaction_S6W(trx, refunInfo);
}

module.exports = { erc20Transfer };