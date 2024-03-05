import {
  Hex,
  createWalletClient,
  encodeFunctionData,
  http,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import {
  createSmartAccountClient,
  PaymasterMode,
  SupportedSigner,
} from "@biconomy-devx/account";
import config from "../../config.json";
import inquirer from "inquirer";
import { getChain } from "../utils/getChain";

export const batchMintNftPayERC20 = async () => {
  // ----- 1. Generate EOA from private key
  const account = privateKeyToAccount(config.privateKey as Hex);
  const client = createWalletClient({
    account,
    chain: getChain(config.chainId),
    transport: http(),
  });
  const eoa = client.account.address;
  console.log(chalk.blue(`EOA address: ${eoa}`));

  // ------ 2. Create biconomy smart account instance
  const smartAccount = await createSmartAccountClient({
    signer: client as SupportedSigner,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
  });
  const scwAddress = await smartAccount.getAccountAddress();
  console.log("SCW Address", scwAddress);

  // ------ 3. Generate transaction data
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
  const parsedAbi = parseAbi(["function safeMint(address _to)"]);
  const nftData = encodeFunctionData({
    abi: parsedAbi,
    functionName: "safeMint",
    args: [scwAddress as Hex],
  });

  // ------ 5. Get Fee quotes (for ERC20 payment)
  const transaction = [
    {
      to: nftAddress,
      data: nftData,
    },
    {
      to: nftAddress,
      data: nftData,
    },
  ];

  const feeQuotesResponse = await smartAccount.getTokenFees(transaction, {
    paymasterServiceData: {
      mode: PaymasterMode.ERC20,
      // preferredToken: config.preferredToken,
      // tokenList: []
    },
  });

  const feeQuotes = feeQuotesResponse.feeQuotes;

  const supportedTokens = await smartAccount.getSupportedTokens();
  if (supportedTokens.length !== feeQuotes?.length) {
    throw new Error(
      "Number of supported tokens and fee quotes should be the same"
    );
  }

  const spender = feeQuotesResponse.tokenPaymasterAddress;
  console.log({ feeQuotesResponse });
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
  const selectedFeeQuote = feeQuotes?.[selectedOption];

  console.log("selected fee quote ", selectedFeeQuote);

  const { waitForTxHash } = await smartAccount.sendTransaction(transaction, {
    paymasterServiceData: {
      mode: PaymasterMode.ERC20,
      feeQuote: selectedFeeQuote,
      spender,
      maxApproval: false,
    },
  });

  // sendTransaction
  // --> buildUserOp
  //    --> getPaymasterUserop
  //      --> buildTokenPaymasterUserOp
  //      --> getPaymasterAndData
  // --> sendUserOp
  const { transactionHash } = await waitForTxHash();
  console.log("transactionHash", transactionHash);
};
