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
import { privateKeyToAccount } from "viem/accounts"
import { createWalletClient, http, encodeFunctionData, Hex } from 'viem';
import { polygonMumbai } from "viem/chains"
import { SmartAccountSigner, WalletClientSigner } from "@alchemy/aa-core";
export const mintNftViem = async () => {
  // ------------------------STEP 1: Initialise Biconomy Smart Account SDK--------------------------------//
  // get EOA address from wallet provider

  const wallet = privateKeyToAccount(`0x${config.privateKey}`) 

  const walletClient = createWalletClient({
        account: wallet,
        chain: polygonMumbai, 
        transport: http(config.rpcUrl),
    });

  let signer = new WalletClientSigner(
        walletClient,
        "json-rpc"
    );

  const eoa = await signer.getAddress();
  console.log(chalk.blue(`EOA address from wallet client signer: ${eoa}`));

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
  };

  console.time("create");
  // create biconomy smart account instance
  const biconomySmartAccount = await BiconomySmartAccountV2.create(
    biconomySmartAccountConfig
  );
  console.timeEnd("create");
  // ------------------------STEP 2: Build Partial User op from your user Transaction/s Request --------------------------------//

  // mint NFT
  // Please note that for sponsorship, policies have to be added on the Biconomy dashboard https://dashboard.biconomy.io/
  // in this case it will be whitelisting NFT contract and method safeMint()

  // 1. for native token transfer no policy is required. you may add a webhook to have custom control over this
  // 2. If no policies are added every transaction will be sponsored by your paymaster
  // 3. If you add policies, then only transactions that match the policy will be sponsored by your paymaster


  console.time("getAccountAddress");
  const scwAddress = await biconomySmartAccount.getAccountAddress();
  console.timeEnd("getAccountAddress");

  // generate mintNft data
  // Here we are minting NFT to smart account address itself

  const data = encodeFunctionData({
    abi: [
        {"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"safeMint","outputs":[],"stateMutability":"nonpayable","type":"function"}
    ],
    functionName: "safeMint",
    args: [scwAddress as Hex]
});

  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"; // Todo // use from config
  const transaction = {
    to: nftAddress,
    data: data,
  };
  // build partial userOp
  console.time("before Build userOp to transaction dispatched:");
  console.time("before Build userOp to transaction mined:");
  console.time("buildUserOp:");
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
