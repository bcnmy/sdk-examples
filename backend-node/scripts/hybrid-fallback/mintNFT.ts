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

export const mintNftTrySponsorshipOtherwisePayERC20 = async () => {
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



  // generate mintNft data
  const nftInterface = new ethers.utils.Interface([
    "function safeMint(address _to)",
  ]);

  // passing accountIndex is optional, by default it will be 0 
  // it should match with the index used to initialise the SDK Biconomy Smart Account instance 
  const scwAddress = await biconomySmartAccount.getSmartAccountAddress(config.accountIndex);

  // Here we are minting NFT to smart account address itself
  const data = nftInterface.encodeFunctionData("safeMint", [scwAddress]);

  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"; // Todo // use from config
  const transaction = {
    to: nftAddress,
    data: data,
  };

  // build partial userOp 
  let partialUserOp = await biconomySmartAccount.buildUserOp([transaction]);

  let finalUserOp = partialUserOp;



  // ------------------------STEP 3: Get direct paymasterAndData or Fee quotes (floating mode) from the paymaster--------------------------------//


  const biconomyPaymaster =
    biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;

  const feeQuotesOrDataResponse =
      await biconomyPaymaster.getPaymasterFeeQuotesOrData(partialUserOp, {
        // here we are leaving the mode open 

        // one can pass tokenList empty array. and it would return fee quotes for all tokens supported by the Biconomy paymaster
        // this will only be considered if gasless sponsorship policy check fails
        tokenList: config.tokenList ? config.tokenList : [],

        // preferredToken is optional. If you want to pay in a specific token, you can pass its address here and get fee quotes for that token only
        // this will only be considered if gasless sponsorship policy check fails
        preferredToken: config.preferredToken,
      });

  if(feeQuotesOrDataResponse.feeQuotes){

  // this means sponsorship is successful and now you can offer fee quotes to the user to pay with ERC20  

  const feeQuotes = feeQuotesOrDataResponse.feeQuotes as PaymasterFeeQuote[];
  const spender = feeQuotesOrDataResponse.tokenPaymasterAddress || "";

  
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

  finalUserOp = await biconomySmartAccount.buildTokenPaymasterUserOp(
    partialUserOp,
    {
      feeQuote: selectedFeeQuote,
      spender: spender,
      maxApproval: false,
    }
  );

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

  

  } else if(feeQuotesOrDataResponse.paymasterAndData){

    // this means sponsorship is successful

    finalUserOp.paymasterAndData = feeQuotesOrDataResponse.paymasterAndData;

    // below code is only needed if you sent the glaf calculateGasLimits = true
    /*if (
      feeQuotesOrDataResponse.callGasLimit &&
      feeQuotesOrDataResponse.verificationGasLimit &&
      feeQuotesOrDataResponse.preVerificationGas
    ) {

      // Returned gas limits must be replaced in your op as you update paymasterAndData.
      // Because these are the limits paymaster service signed on to generate paymasterAndData
      // If you receive AA34 error check here..   

      finalUserOp.callGasLimit = feeQuotesOrDataResponse.callGasLimit;
      finalUserOp.verificationGasLimit =
        feeQuotesOrDataResponse.verificationGasLimit;
      finalUserOp.preVerificationGas =
        feeQuotesOrDataResponse.preVerificationGas;
    }*/ 
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
