const { ethers } = require("ethers");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const SmartAccount = require("@biconomy-devx/smart-account").default;
const { ChainId, Environments } = require("@biconomy-devx/core-types");
const config = require("../config.json");
const abi = require("./abi.json");

const batchErc20Transfer = async (recipientAddress, amount, tokenAddress) => {
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
  const erc20Data1 = erc20Interface.encodeFunctionData(
    'transfer', [recipientAddress[0], amountGwei]
  )
  const erc20Data2 = erc20Interface.encodeFunctionData(
    'transfer', [recipientAddress[1], amountGwei]
  )
  console.log([recipientAddress[0], recipientAddress[1]], [0, 0], [erc20Data1, erc20Data2])
  // SCW executeCall
  const scwData = await scwContract.populateTransaction.executeBatchCall([tokenAddress, tokenAddress], [0, 0], [erc20Data1, erc20Data2]);
  const tx = {
    to: smartAccount.address,
    data: scwData.data,
    from: eoa
  }
  console.log(tx)
  const txResponse = await walletProvider.send('eth_sendTransaction', [tx]);
  console.log('executeCall tx', txResponse);

  // SCW pullTokens
  // const scwPullTokensData = await scwContract.populateTransaction.pullTokens(tokenAddress, recipientAddress, amountGwei);
  // const pullTokensTx = {
  //   to: smartAccount.address,
  //   data: scwPullTokensData.data,
  //   from: eoa
  // }
  // console.log(pullTokensTx)
  // const pullTokensTxResponse = await walletProvider.send('eth_sendTransaction', [pullTokensTx]);
  // console.log('pullTokens tx', pullTokensTxResponse);
}

module.exports = { batchErc20Transfer };