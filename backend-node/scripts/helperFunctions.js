const { BiconomySmartAccount, ENTRYPOINT_ADDRESSES } = require("@biconomy/account");
const { Bundler } = require("@biconomy/bundler")
const { BiconomyPaymaster } = require("@biconomy/paymaster")
const HDWalletProvider = require("@truffle/hdwallet-provider");
const { ethers } = require("ethers");
const chalk = require('chalk');
const config = require("../config.json");

async function createBiconomyAccountInstance() {
    console.log('ENTRYPOINT_ADDRESSES', ENTRYPOINT_ADDRESSES);

    let provider = new HDWalletProvider(config.privateKey, config.rpcUrl);
    const walletProvider = new ethers.providers.Web3Provider(provider);
    // get EOA address from wallet provider
    const eoa = await walletProvider.getSigner().getAddress();
    console.log(chalk.blue(`EOA address: ${eoa}`));

    const bundler = new Bundler({
        bundlerUrl: config.bundlerUrl,
        chainId: config.chainId,
        entryPointAddress: ENTRYPOINT_ADDRESSES.default,
        apiKey: config.dappAPIKey,
    })

    const paymaster = new BiconomyPaymaster({
        paymasterUrl: config.paymasterUrl,
        apiKey: config.dappAPIKey
    })

    const biconomySmartAccountConfig = {
        signer: walletProvider.getSigner(),
        chainId: config.chainId,
        rpcUrl: config.rpcUrl,
        paymaster: paymaster,
        bundler: bundler,
    }

    const biconomyAccount = new BiconomySmartAccount(biconomySmartAccountConfig)
    const biconomySmartAccount = await biconomyAccount.init()
    return biconomySmartAccount
}

async function buildAndSendUserOp(biconomySmartAccount, transaction) {
    // Sending transaction
    const userOp = await biconomySmartAccount.buildUserOp([transaction])
    const userOpResponse = await biconomySmartAccount.sendUserOp(userOp)
    console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
    const transactionDetails = await userOpResponse.wait()
    console.log(chalk.green(`transactionDetails: ${JSON.stringify(transactionDetails)}`));
}

module.exports = {
    createBiconomyAccountInstance,
    buildAndSendUserOp
}