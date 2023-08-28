import { ethers } from "ethers";
const chalk = require('chalk')
import inquirer from "inquirer";
import {
    BiconomySmartAccount,
    DEFAULT_ENTRYPOINT_ADDRESS,
  } from "@biconomy-devx/account";
  import { Bundler } from "@biconomy-devx/bundler";
  import { BiconomyPaymaster } from "@biconomy-devx/paymaster";
import {
  IHybridPaymaster,
  PaymasterFeeQuote,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy-devx/paymaster";
import config from "../../config.json";

export const nativeTransferPayERC20 = async (
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

  // passing accountIndex is optional, by default it will be 0. You may use different indexes for generating multiple counterfactual smart accounts for the same user
  const biconomySmartAccount = await biconomyAccount.init( {accountIndex: config.accountIndex} );




  // ------------------------STEP 2: Build Partial User op from your user Transaction/s Request --------------------------------//

  // // transfer native asset
  const transaction = {
    to: to || "0x0000000000000000000000000000000000000000",
    data: "0x",
    value: ethers.utils.parseEther(amount.toString()),
  };

  // build partial userOp 
  let partialUserOp = await biconomySmartAccount.buildUserOp([transaction]);

  let finalUserOp = partialUserOp;




  // ------------------------STEP 3: Get Fee quotes (for ERC20 payment) from the paymaster and ask the user to select one--------------------------------//




  const biconomyPaymaster =
    biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;

  const feeQuotesResponse =
      await biconomyPaymaster.getPaymasterFeeQuotesOrData(partialUserOp, {
        // here we are explicitly telling by mode ERC20 that we want to pay in ERC20 tokens and expect fee quotes
        mode: PaymasterMode.ERC20,
        // one can pass tokenList empty array. and it would return fee quotes for all tokens supported by the Biconomy paymaster
        tokenList: config.tokenList ? config.tokenList : [],
        // preferredToken is optional. If you want to pay in a specific token, you can pass its address here and get fee quotes for that token only
        preferredToken: config.preferredToken,
      });

  const feeQuotes = feeQuotesResponse.feeQuotes as PaymasterFeeQuote[];
  const spender = feeQuotesResponse.tokenPaymasterAddress || "";

  
  // Generate list of options for the user to select
  const choices = feeQuotes?.map((quote: any, index: number) => ({
      name: `Option ${index + 1}: ${quote.maxGasFee}: ${quote.symbol} `,
      value: index,
    }));
  // Use inquirer to prompt user to select an option
  const { selectedOption } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedOption",
        message: "Select a fee quote:",
        choices,
      },
    ]);
  const selectedFeeQuote = feeQuotes[selectedOption];




  // ------------------------STEP 3: Once you have selected feeQuote (use has chosen token to pay with) get updated userOp which checks for paymaster approval and appends approval tx--------------------------------//
    



  finalUserOp = await biconomySmartAccount.buildTokenPaymasterUserOp(
      partialUserOp,
      {
        feeQuote: selectedFeeQuote,
        spender: spender,
        maxApproval: false,
      }
    );

  

  // ------------------------STEP 4: Get Paymaster and Data from Biconomy Paymaster --------------------------------//  




  let paymasterServiceData = {
      mode: PaymasterMode.ERC20, // - mandatory // now we know chosen fee token and requesting paymaster and data for it
      feeTokenAddress: selectedFeeQuote.tokenAddress,
      // calculateGasLimits: true, // - optional by default false
    };

  try{
    const paymasterAndDataWithLimits =
      await biconomyPaymaster.getPaymasterAndData(
        finalUserOp,
        paymasterServiceData
      );
    finalUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData;

    // below code is only needed if you sent the glaf calculateGasLimits = true
    /*if (
      paymasterAndDataWithLimits.callGasLimit &&
      paymasterAndDataWithLimits.verificationGasLimit &&
      paymasterAndDataWithLimits.preVerificationGas
    ) {

      // Returned gas limits must be replaced in your op as you update paymasterAndData.
      // Because these are the limits paymaster service signed on to generate paymasterAndData
      // If you receive AA34 error check here..   

      finalUserOp.callGasLimit = paymasterAndDataWithLimits.callGasLimit;
      finalUserOp.verificationGasLimit =
        paymasterAndDataWithLimits.verificationGasLimit;
      finalUserOp.preVerificationGas =
        paymasterAndDataWithLimits.preVerificationGas;
    }*/ 
  } catch (e) {
    console.log("error received ", e);
  }




  // ------------------------STEP 5: Sign the UserOp and send to the Bundler--------------------------------//




  console.log(chalk.blue(`userOp: ${JSON.stringify(finalUserOp, null, "\t")}`));

  // Below function gets the signature from the user (signer provided in Biconomy Smart Account) 
  // and also send the full op to attached bundler instance

  try {
  const userOpResponse = await biconomySmartAccount.sendUserOp(finalUserOp);
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
