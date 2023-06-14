const { BiconomySmartAccount, DEFAULT_ENTRYPOINT_ADDRESS } = require("@biconomy/account");
const { Bundler } = require("@biconomy/bundler")
const { BiconomyVerifyingPaymaster } = require("@biconomy/paymaster")
const HDWalletProvider = require("@truffle/hdwallet-provider");
const { ethers } = require("ethers");
const chalk = require('chalk');
const config = require("../config.json");

async function createBiconomyAccountInstance() {

    let provider = new HDWalletProvider(config.privateKey, config.rpcUrl);
    const walletProvider = new ethers.providers.Web3Provider(provider);
    // get EOA address from wallet provider
    const eoa = await walletProvider.getSigner().getAddress();
    console.log(chalk.blue(`EOA address: ${eoa}`));

    const bundler = new Bundler({
        bundlerUrl: config.bundlerUrl,
        chainId: config.chainId,
        entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
        apiKey: config.dappAPIKey,
    })

    const paymaster = new BiconomyVerifyingPaymaster({
        paymasterUrl: config.verifyingPaymasterUrl,
    })

    const biconomySmartAccountConfig = {
        signer: walletProvider.getSigner(),
        chainId: config.chainId,
        rpcUrl: config.rpcUrl,
        // paymaster: paymaster, // temp disable
        bundler: bundler,
    }

    const biconomyAccount = new BiconomySmartAccount(biconomySmartAccountConfig)
    const biconomySmartAccount = await biconomyAccount.init()
    return biconomySmartAccount
}

async function buildAndSendUserOpForBatch(biconomySmartAccount, transactions) {
    // Sending transaction
    const userOp = await biconomySmartAccount.buildUserOp(transactions)
    const userOpResponse = await biconomySmartAccount.sendUserOp(userOp)
    console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
    const transactionDetails = await userOpResponse.wait()
    console.log(chalk.green(`transactionDetails: ${JSON.stringify(transactionDetails)}`));
}

async function buildAndSendUserOp(biconomySmartAccount, transaction) {
    // Sending transaction
    const userOp = await biconomySmartAccount.buildUserOp([transaction])
    const userOpResponse = await biconomySmartAccount.sendUserOp(userOp)
    console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
    const transactionDetails = await userOpResponse.wait()
    console.log(chalk.green(`transactionDetails: ${JSON.stringify(transactionDetails)}`));
}

async function sendUserOp(biconomySmartAccount, userOp) {
    const userOpResponse = await biconomySmartAccount.sendUserOp(userOp)
    console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
    const transactionDetails = await userOpResponse.wait()
    console.log(chalk.green(`transactionDetails: ${JSON.stringify(transactionDetails)}`));
}

module.exports = {
    createBiconomyAccountInstance,
    buildAndSendUserOp,
    sendUserOp,
    buildAndSendUserOpForBatch
}