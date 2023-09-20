import { ethers } from "ethers";
const chalk = require('chalk')
import {
  BiconomySmartAccountV2,
  DEFAULT_ENTRYPOINT_ADDRESS,
} from "@biconomy-devx/account";
import { Bundler } from "@biconomy-devx/bundler";
import { BiconomyPaymaster } from "@biconomy-devx/paymaster";
import { Transaction, UserOperation } from "@biconomy-devx/core-types";
import { ECDSAOwnershipValidationModule, MultiChainValidationModule, DEFAULT_ECDSA_OWNERSHIP_MODULE, DEFAULT_MULTICHAIN_MODULE } from "@biconomy-devx/modules";
import config from "../config.json";

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
  });
  const paymaster = new BiconomyPaymaster({
    paymasterUrl: config.biconomyPaymasterUrl,
    strictMode: false // by default is true. If set to false, then paymaster and data is still sent as 0x and account will pay in native
  });

  const ecdsaModule = await ECDSAOwnershipValidationModule.create({
    signer: signer,
    moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE
  })

  const multiChainModule = await MultiChainValidationModule.create({
    signer: signer,
    moduleAddress: DEFAULT_MULTICHAIN_MODULE
  })

  // create biconomy smart account instance
  const biconomySmartAccountConfig = {
    signer: signer,
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    paymaster: paymaster, // optional
    bundler: bundler, // optional
    // nodeClientUrl: config.nodeClientUrl, // if needed to override
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    defaultValidationModule: ecdsaModule,
    activeValidationModule: ecdsaModule
  };
  const biconomyAccount = await BiconomySmartAccountV2.create(biconomySmartAccountConfig);
  const biconomySmartAccount = await biconomyAccount.init();
  console.log(biconomyAccount.accountAddress)
  return biconomySmartAccount;
}

async function sendUserOp(
  biconomySmartAccount: BiconomySmartAccountV2,
  userOp: Partial<UserOperation>
) {
  console.log(chalk.blue(`userOp: ${JSON.stringify(userOp, null, "\t")}`));
  const userOpResponse = await biconomySmartAccount.sendUserOp(userOp);
  console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
  const transactionDetails = await userOpResponse.wait();
  console.log(
    chalk.blue(
      `transactionDetails: ${JSON.stringify(transactionDetails, null, "\t")}`
    )
  );
}

export { createBiconomyAccountInstance, sendUserOp };
