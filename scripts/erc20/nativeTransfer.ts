import { Hex, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { polygonMumbai } from "viem/chains";
import { createSmartWalletClient } from "@biconomy/account";
import {
  IHybridPaymaster,
  PaymasterFeeQuote,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy/paymaster";
import config from "../../config.json";
import inquirer from "inquirer";

export const nativeTransferPayERC20 = async (to: string, amount: number) => {
  // ----- 1. Generate EOA from private key
  const account = privateKeyToAccount(config.privateKey as Hex);
  const client = createWalletClient({
    account,
    chain: polygonMumbai,
    transport: http(),
  });
  const eoa = client.account.address;
  console.log(chalk.blue(`EOA address: ${eoa}`));

  // ------ 2. Create biconomy smart account instance
  const biconomySmartAccount = await createSmartWalletClient({
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    signer: client,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
  });
  const scwAddress = await biconomySmartAccount.getAccountAddress();
  console.log("SCW Address", scwAddress);

  // ------ 3. Generate transaction data
  const txData = {
    to,
    value: parseEther(amount.toString()),
    data: "0x",
  };

  // ------ 4. Build partial user operation
  const userOp = await biconomySmartAccount.buildUserOp([txData]);
  console.log("userOp", userOp);

  // ------ 5. Get Fee quotes (for ERC20 payment)
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

  // Once you have selected feeQuote (use has chosen token to pay with) get updated userOp which checks for paymaster approval and appends approval tx
  // ------ 5. Build user operation
  const finalUserOp = await biconomySmartAccount.buildTokenPaymasterUserOp(
    userOp,
    {
      feeQuote: selectedFeeQuote,
      spender: spender as Hex,
      maxApproval: false,
    }
  );

  // ------ 6. Get paymaster and data for erc20 payment
  let paymasterServiceData = {
    mode: PaymasterMode.ERC20, // - mandatory // now we know chosen fee token and requesting paymaster and data for it
    feeTokenAddress: selectedFeeQuote.tokenAddress,
  };
  try {
    const pData = await biconomyPaymaster.getPaymasterAndData(
      finalUserOp,
      paymasterServiceData
    );
    finalUserOp.paymasterAndData = pData.paymasterAndData;
    // below code is only needed if you sent the flag calculateGasLimits = true
    // default value of calculateGasLimits is true
    finalUserOp.callGasLimit = pData.callGasLimit;
    finalUserOp.verificationGasLimit = pData.verificationGasLimit;
    finalUserOp.preVerificationGas = pData.preVerificationGas;
  } catch (e) {
    console.log("error received ", e);
  }

  // ------ 7. Send user operation and get tx hash
  const tx = await biconomySmartAccount.sendUserOp(finalUserOp);
  const { transactionHash } = await tx.waitForTxHash();
  console.log("transactionHash", transactionHash);
};
