const { BiconomySmartAccount, DEFAULT_ENTRYPOINT_ADDRESS } = require("@biconomy-devx/account");
const { Bundler } = require("@biconomy-devx/bundler")
const { BiconomyPaymaster } = require("@biconomy-devx/paymaster")
const { ethers } = require("ethers");
const chalk = require('chalk');
const config = require("../config.json");

async function createBiconomyAccountInstance() {
    // get EOA address from wallet provider
    let provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    let signer = new ethers.Wallet(config.privateKey, provider);
    const eoa = await signer.getAddress();
    console.log(chalk.blue(`EOA address: ${eoa}`));

    // create bundler and paymaster instances
    const bundler = new Bundler({
        bundlerUrl: config.bundlerUrl,
        chainId: config.chainId,
        entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    })
    const paymaster = new BiconomyPaymaster({
        paymasterUrl: config.biconomyPaymasterUrl,
    })

    // create biconomy smart account instance
    const biconomySmartAccountConfig = {
        signer: signer,
        chainId: config.chainId,
        rpcUrl: config.rpcUrl,
        paymaster: paymaster,
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
    console.log(chalk.blue(`transactionDetails: ${JSON.stringify(transactionDetails, null, '\t')}`));
}

async function sendUserOp(biconomySmartAccount, userOp) {
    const userOpResponse = await biconomySmartAccount.sendUserOp(userOp)
    console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
    const transactionDetails = await userOpResponse.wait()
    console.log(chalk.blue(`transactionDetails: ${JSON.stringify(transactionDetails, null, '\t')}`));
}

async function buildAndSendUserOp(biconomySmartAccount, transaction) {
    // Sending transaction
    const userOp = await biconomySmartAccount.buildUserOp([transaction])
    const userOpResponse = await biconomySmartAccount.sendUserOp(userOp)
    console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
    const transactionDetails = await userOpResponse.wait()
    console.log(chalk.blue(`transactionDetails: ${JSON.stringify(transactionDetails, null, '\t')}`));
}

module.exports = {
    createBiconomyAccountInstance,
    buildAndSendUserOp,
    sendUserOp,
    buildAndSendUserOpForBatch
}