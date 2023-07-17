import { ethers } from "ethers";
import chalk from "chalk";
import {
    BiconomySmartAccount,
    DEFAULT_ENTRYPOINT_ADDRESS,
  } from "@biconomy/account";
  import { Bundler } from "@biconomy/bundler";
  import { BiconomyPaymaster } from "@biconomy/paymaster";
import {
  IHybridPaymaster,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy/paymaster";
import config from "../../config.json";

export const nativeTransfer = async (
  to: string,
  amount: number
) => {

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
    paymasterUrl: config.biconomyPaymasterUrl
  });

  // Biconomy smart account config
  // Note that paymaster and bundler are optional. You can choose to create new instances of this later and make account API use 
  const biconomySmartAccountConfig = {
    signer: signer,
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    paymaster: paymaster, 
    bundler: bundler, 
  };

  // create biconomy smart account instance
  const biconomyAccount = new BiconomySmartAccount(biconomySmartAccountConfig);
  const biconomySmartAccount = await biconomyAccount.init( {accountIndex: config.accountIndex} );


  // ------------------------STEP 2: Build Partial User op from your user Transaction/s Request --------------------------------//

  
  // transfer native asset
  // Please note that for sponsorship, policies have to be added on the Biconomy dashboard https://dashboard.biconomy.io/
  // 1. for native token transfer no policy is required. you may add a webhook to have custom control over this
  // 2. If no policies are added every transaction will be sponsored by your paymaster
  // 3. If you add policies, then only transactions that match the policy will be sponsored by your paymaster
  const transaction = {
    to: to || "0x0000000000000000000000000000000000000000",
    data: "0x",
    value: ethers.utils.parseEther(amount.toString()),
  };

  // build partial userOp
  let partialUserOp = await biconomySmartAccount.buildUserOp([transaction]);


  // ------------------------STEP 3: Get Paymaster and Data from Biconomy Paymaster --------------------------------//


  const biconomyPaymaster =
    biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;

  // Here it is meant to act as Sponsorship/Verifying paymaster hence we send mode: PaymasterMode.SPONSORED which is must  
  let paymasterServiceData: SponsorUserOperationDto = {
        mode: PaymasterMode.SPONSORED,
        // optional params...
    };

  try {
    const paymasterAndDataResponse =
      await biconomyPaymaster.getPaymasterAndData(
        partialUserOp,
        paymasterServiceData
      );
      partialUserOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;
  } catch (e) {
    console.log("error received ", e);
  }

  
  // ------------------------STEP 4: Sign the UserOp and send to the Bundler--------------------------------//

  console.log(chalk.blue(`userOp: ${JSON.stringify(partialUserOp, null, "\t")}`));

  // Below function gets the signature from the user (signer provided in Biconomy Smart Account) 
  // and also send the full op to attached bundler instance

  try {
  const userOpResponse = await biconomySmartAccount.sendUserOp(partialUserOp);
  console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
  const transactionDetails = await userOpResponse.wait();
  console.log(
    chalk.blue(
      `transactionDetails: ${JSON.stringify(transactionDetails, null, "\t")}`
    )
  );
  } catch (e) {
    console.log("error received ", e);
  }
};
