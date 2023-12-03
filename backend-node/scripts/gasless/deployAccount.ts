import { ethers } from "ethers";
const chalk = require("chalk");
import {
  BiconomySmartAccountV2,
  DEFAULT_ENTRYPOINT_ADDRESS,
} from "@biconomy/account";
import { Bundler, UserOpStatus } from "@biconomy/bundler";
import { BiconomyPaymaster } from "@biconomy/paymaster";
import { PaymasterMode } from "@biconomy/paymaster";
import {
  ECDSAOwnershipValidationModule,
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
} from "@biconomy/modules";
import config from "../../config.json";

export const deployAccountOnly = async () => {
  // ------------------------STEP 1: Initialise Biconomy Smart Account SDK--------------------------------//
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
  });

  const ecdsaModule = await ECDSAOwnershipValidationModule.create({
    signer: signer,
    moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE,
  });

  // Biconomy smart account config
  // Note that paymaster and bundler are optional. You can choose to create new instances of this later and make account API use
  const biconomySmartAccountConfig = {
    signer: signer,
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    paymaster: paymaster,
    bundler: bundler,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    defaultValidationModule: ecdsaModule,
    activeValidationModule: ecdsaModule,
    index: config.accountIndex,
  };

  console.time("create");
  // create biconomy smart account instance
  const biconomySmartAccount = await BiconomySmartAccountV2.create(
    biconomySmartAccountConfig
  );
  console.timeEnd("create");
  // ------------------------STEP 2: Build Partial User op from your user Transaction/s Request --------------------------------//
  const scwAddress = await biconomySmartAccount.getAccountAddress();
  console.log(chalk.blue(`Smart Account Wallet address: ${scwAddress}`));  

  const isDeployed = await biconomySmartAccount.isAccountDeployed(biconomySmartAccount.accountAddress || "");
  console.log(chalk.blue(`isDeployed: ${isDeployed}`));

  if(isDeployed) {
    throw new Error("Account already deployed");
  }

  console.time("getAccountAddress");
  console.timeEnd("getAccountAddress");
  // Here we are providing 0 address and 0 data transaction so that the sdk knows not to send a transaction.
  const transaction = {
    to: ethers.constants.AddressZero,
    data: '0x',
  };
  // build partial userOp
  console.time("before Build userOp to transaction dispatched:");
  console.time("before Build userOp to transaction mined:");
  console.time("buildUserOp:");
  // If you're not using a paymaster, then you can skip the paymasterServiceData, but the account address (counterfactual) should have enough native tokens for self payment
  let partialUserOp = await biconomySmartAccount.buildUserOp([transaction], {
    // If we are sure to use sponsorship paymaster and for Biconomy Account V2 then pass mode like this below.
    paymasterServiceData: {
      mode: PaymasterMode.SPONSORED,
    },
    // skipBundlerGasEstimation: false, // true by default as if the paymaster is present gas estimations are done on the paymaster
  });
  console.timeEnd("buildUserOp:");

  // ------------------------STEP 3: Sign the UserOp and send to the Bundler--------------------------------//

  console.log(
    chalk.blue(`userOp: ${JSON.stringify(partialUserOp, null, "\t")}`)
  );

  // Below function gets the signature from the user (signer provided in Biconomy Smart Account)
  // and also send the full op to attached bundler instance
  try {
    console.time("sendUserOp");

    const userOpResponse = await biconomySmartAccount.sendUserOp(partialUserOp);
    console.timeEnd("sendUserOp");
    console.time("wait1");
    // strict types
    const transactionDetails1: UserOpStatus =
      await userOpResponse.waitForTxHash();
    console.log("transachion hash", transactionDetails1.transactionHash);
    console.timeEnd("wait1");
    console.timeEnd("before Build userOp to transaction dispatched:");

    console.time("wait");
    const transactionDetails = await userOpResponse.wait();
    console.timeEnd("wait");
    console.timeEnd("before Build userOp to transaction mined:");
    console.log("Tx Hash: ", transactionDetails.receipt.transactionHash);
  } catch (e) {
    console.log("error received ", e);
  }
};
