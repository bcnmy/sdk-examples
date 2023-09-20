import { ethers } from "ethers";
const chalk = require('chalk')

import {
    BiconomySmartAccountV2,
    DEFAULT_ENTRYPOINT_ADDRESS,
  } from "@biconomy-devx/account";
  import { Bundler } from "@biconomy-devx/bundler";
  import { BiconomyPaymaster } from "@biconomy-devx/paymaster";
import {
  IHybridPaymaster,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy-devx/paymaster";
import config from "../../config.json";
import { ECDSAOwnershipValidationModule, MultiChainValidationModule, DEFAULT_ECDSA_OWNERSHIP_MODULE, DEFAULT_MULTICHAIN_MODULE, DEFAULT_SESSION_KEY_MANAGER_MODULE  } from "@biconomy-devx/modules";

export const mintNft = async () => {

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

  const ecdsaModule = await ECDSAOwnershipValidationModule.create({
    signer: signer,
    moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE
  })

  const multiChainModule = await MultiChainValidationModule.create({
    signer: signer,
    moduleAddress: DEFAULT_MULTICHAIN_MODULE
  })

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
    activeValidationModule: ecdsaModule
  };

  // create biconomy smart account instance
  const biconomyAccount = await BiconomySmartAccountV2.create(biconomySmartAccountConfig);

  
  const biconomySmartAccount = await biconomyAccount.init();



  // ------------------------STEP 2: Build Partial User op from your user Transaction/s Request --------------------------------//

  
  // mint NFT
  // Please note that for sponsorship, policies have to be added on the Biconomy dashboard https://dashboard.biconomy.io/
  // in this case it will be whitelisting NFT contract and method safeMint()

  // 1. for native token transfer no policy is required. you may add a webhook to have custom control over this
  // 2. If no policies are added every transaction will be sponsored by your paymaster
  // 3. If you add policies, then only transactions that match the policy will be sponsored by your paymaster

  // generate mintNft data
  const nftInterface = new ethers.utils.Interface([
    "function safeMint(address _to)",
  ]);


  const scwAddress = await biconomySmartAccount.getAccountAddress();

  // Here we are minting NFT to smart account address itself
  const data = nftInterface.encodeFunctionData("safeMint", [scwAddress]);

  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"; // Todo // use from config
  const transaction = {
    to: nftAddress,
    data: data,
  };

  // build partial userOp
  let partialUserOp = await biconomySmartAccount.buildUserOp([transaction]);


  // ------------------------STEP 3: Get Paymaster and Data from Biconomy Paymaster --------------------------------//


  const biconomyPaymaster =
    biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;

  // Here it is meant to act as Sponsorship/Verifying paymaster hence we send mode: PaymasterMode.SPONSORED which is must  
  let paymasterServiceData: SponsorUserOperationDto = {
        mode: PaymasterMode.SPONSORED,
        smartAccountInfo: {
          name: 'BICONOMY',
          version: '2.0.0'
        },
        // optional params...
        calculateGasLimits: true
    };

  try {
    const paymasterAndDataResponse =
      await biconomyPaymaster.getPaymasterAndData(
        partialUserOp,                                                                                  
        paymasterServiceData
      );
      partialUserOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;

      if (
        paymasterAndDataResponse.callGasLimit &&
        paymasterAndDataResponse.verificationGasLimit &&
        paymasterAndDataResponse.preVerificationGas
      ) {
  
        // Returned gas limits must be replaced in your op as you update paymasterAndData.
        // Because these are the limits paymaster service signed on to generate paymasterAndData
        // If you receive AA34 error check here..   
  
        partialUserOp.callGasLimit = paymasterAndDataResponse.callGasLimit;
        partialUserOp.verificationGasLimit =
        paymasterAndDataResponse.verificationGasLimit;
        partialUserOp.preVerificationGas =
        paymasterAndDataResponse.preVerificationGas;
      }
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

  /*try {
    const userOpResponse = await biconomySmartAccount.enableModule(DEFAULT_SESSION_KEY_MANAGER_MODULE);
    console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
    const transactionDetails = await userOpResponse.wait();
    console.log(
      chalk.blue(
        `transactionDetails: ${JSON.stringify(transactionDetails, null, "\t")}`
      )
    );
    } catch (e) {
      console.log("error received ", e);
    }*/
};