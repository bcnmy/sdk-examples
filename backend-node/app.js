const { ethers } = require("ethers");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const SmartAccount = require("@biconomy/smart-account").default;

const infura = "https://goerli.infura.io/v3/f0493a02561f4419be93dde46cc584c6";
const pkey = "<your private key>";

const main = async () => {
  let provider = new HDWalletProvider(pkey, infura);
  const walletProvider = new ethers.providers.Web3Provider(provider);

  const wallet = new SmartAccount(walletProvider, {
    activeNetworkId: 5,
    supportedNetworksIds: [5],
  });
  const smartAccount = await wallet.init();
  console.log(smartAccount);

};

main();
