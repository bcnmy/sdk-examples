import { ethers } from "ethers";
import { Hex, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { polygonMumbai } from "viem/chains";
import { WalletClientSigner } from "@alchemy/aa-core";
import { BiconomySmartAccountV2 } from "@biconomy-devx/account";
import { Bundler } from "@biconomy-devx/bundler";
import {
  BiconomyPaymaster,
  IHybridPaymaster,
  PaymasterFeeQuote,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy-devx/paymaster";
import config from "../../config.json";
import inquirer from "inquirer";

export const mintNftPayERC20 = async () => {
  const account = privateKeyToAccount(config.privateKey as Hex);
  const client = createWalletClient({
    account,
    chain: polygonMumbai,
    transport: http(),
  });

  const eoa = client.account.address;
  console.log(chalk.blue(`EOA address: ${eoa}`));

  const bundler = new Bundler({
    bundlerUrl: config.bundlerUrl,
    chainId: config.chainId,
  });
  const paymaster = new BiconomyPaymaster({
    paymasterUrl: config.biconomyPaymasterUrl,
  });

  // create biconomy smart account instance
  const biconomySmartAccount = await BiconomySmartAccountV2.create({
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    bundler: bundler,
    signer: new WalletClientSigner(client as any, "viem"),
    biconomyPaymasterApiKey: "tf47vamuW.3c55594d-14f8-4451-b5dd-39f46abe272a",
  });
  const scwAddress = await biconomySmartAccount.getAccountAddress();
  console.log("SCW Address", scwAddress);

  // generate mintNft data
  const nftInterface = new ethers.utils.Interface([
    "function safeMint(address _to)",
  ]);
  // Here we are minting NFT to smart account address itself
  const data = nftInterface.encodeFunctionData("safeMint", [scwAddress]);
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";

  const userOp = await biconomySmartAccount.buildUserOp([
    {
      to: nftAddress,
      data: data,
      value: 0,
    },
  ]);
  console.log("userOp", userOp);
  let finalUserOp = userOp;

  // ------------------------STEP 3: Get Fee quotes (for ERC20 payment) from the paymaster and ask the user to select one--------------------------------//
  const biconomyPaymaster =
    biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
  const feeQuotesResponse = await biconomyPaymaster.getPaymasterFeeQuotesOrData(
    userOp,
    {
      // here we are explicitly telling by mode ERC20 that we want to pay in ERC20 tokens and expect fee quotes
      mode: PaymasterMode.ERC20,
      // one can pass tokenList empty array. and it would return fee quotes for all tokens supported by the Biconomy paymaster
      tokenList: config.tokenList ? config.tokenList : [],
      // preferredToken is optional. If you want to pay in a specific token, you can pass its address here and get fee quotes for that token only
      preferredToken: config.preferredToken,
    }
  );
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
  finalUserOp = await biconomySmartAccount.buildTokenPaymasterUserOp(userOp, {
    feeQuote: selectedFeeQuote,
    spender: spender as Hex,
    maxApproval: false,
  });

  // ------------------------Get Paymaster and Data from Biconomy Paymaster --------------------------------//

  let paymasterServiceData = {
    mode: PaymasterMode.ERC20, // - mandatory // now we know chosen fee token and requesting paymaster and data for it
    feeTokenAddress: selectedFeeQuote.tokenAddress,
    // optional params..
    calculateGasLimits: true, // Always recommended and especially when using token paymaster
  };
  try {
    const paymasterAndDataWithLimits =
      await biconomyPaymaster.getPaymasterAndData(
        finalUserOp,
        paymasterServiceData
      );
    finalUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData;

    // below code is only needed if you sent the flag calculateGasLimits = true
    if (
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
    }
  } catch (e) {
    console.log("error received ", e);
  }

  // ------------------------STEP 5: Sign the UserOp and send to the Bundler--------------------------------//

  console.log(chalk.blue(`userOp: ${JSON.stringify(finalUserOp, null, "\t")}`));

  // Below function gets the signature from the user (signer provided in Biconomy Smart Account)
  // and also send the full op to attached bundler instance

  try {
    const tx = await biconomySmartAccount.sendUserOp(userOp);
    const { transactionHash } = await tx.waitForTxHash();
    console.log("transactionHash", transactionHash);
    console.log(
      chalk.blue(
        `transactionDetails: ${JSON.stringify(transactionHash, null, "\t")}`
      )
    );
  } catch (e) {
    console.log("error received ", e);
  }
};
