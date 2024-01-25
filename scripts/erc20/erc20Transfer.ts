import {
  Hex,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { polygonMumbai } from "viem/chains";
import { createSmartAccountClient } from "@biconomy/account";
import {
  IHybridPaymaster,
  PaymasterFeeQuote,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy/paymaster";
import config from "../../config.json";
import inquirer from "inquirer";
import { ERC20ABI } from "../utils/abi";

export const erc20TransferPayERC20 = async (
  recipientAddress: string,
  amount: number,
  tokenAddress: string
) => {
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
  const smartWallet = await createSmartAccountClient({
    signer: client,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey, 
  });
  const scwAddress = await smartWallet.getAccountAddress();
  console.log("SCW Address", scwAddress);

  // ------ 3. Generate transaction data
  console.log("imp", parseEther(amount.toString()));
  const data = encodeFunctionData({
    abi: ERC20ABI,
    functionName: "transfer",
    args: [recipientAddress, parseEther(amount.toString())], // parsing token value with base 18
  });

  // ------ 4. Build partial user operation
  const userOp = await smartWallet.buildUserOp([
    {
      to: tokenAddress,
      data: data,
    },
  ]);
  console.log("userOp", userOp);

  // ------ 5. Get Fee quotes (for ERC20 payment)
  const biconomyPaymaster =
    smartWallet.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
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
  const spender = feeQuotesResponse.tokenPaymasterAddress;
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

  const finalUserOp = await smartWallet.getPaymasterUserOp(userOp, {
    mode: PaymasterMode.ERC20,
    feeQuote: selectedFeeQuote,
    spender,
  })

  // ------ 6. Send user operation and get tx hash
  const tx = await smartWallet.sendUserOp(finalUserOp);
  const { transactionHash } = await tx.waitForTxHash();
  console.log("transactionHash", transactionHash);
};
