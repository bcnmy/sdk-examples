import { ethers } from "ethers";
const chalk = require("chalk");
import inquirer from "inquirer";
import {
  createSmartAccountClient,
  PaymasterMode,
  PaymasterFeeQuote,
} from "@biconomy/account";
import config from "../../config.json";
import { Hex } from "viem";

export const mintNftTrySponsorshipOtherwisePayERC20 = async () => {
  // ------------------------STEP 1: Initialise Biconomy Smart Account SDK--------------------------------//

  // get EOA address from wallet provider
  let provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  let signer = new ethers.Wallet(config.privateKey, provider);
  const eoa = await signer.getAddress();
  console.log(chalk.blue(`EOA address: ${eoa}`));

  // create biconomy smart account instance
  const smartWallet = await createSmartAccountClient({
    signer,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
    bundlerUrl: config.bundlerUrl,
  });

  // ------------------------STEP 2: Build the transaction --------------------------------//

  const nftInterface = new ethers.utils.Interface([
    "function safeMint(address _to)",
  ]);

  const scwAddress = await smartWallet.getAccountAddress();

  // Here we are minting NFT to smart account address itself
  const data = nftInterface.encodeFunctionData("safeMint", [scwAddress]);

  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"; // Todo // use from config
  const transaction = {
    to: nftAddress,
    data: data,
  };

  // ------------------------STEP 3: Prepare and send user operation --------------------------------//
  const feeQuotesOrDataResponse = await smartWallet.getTokenFees(transaction, {
    paymasterServiceData: {
      tokenList: config.tokenList ? config.tokenList : [],
      preferredToken: config.preferredToken,
      mode: PaymasterMode.ERC20,
    },
  });

  let userOpResponse;

  if (feeQuotesOrDataResponse.feeQuotes) {
    // this means sponsorship is successful and now you can offer fee quotes to the user to pay with ERC20

    const feeQuotes = feeQuotesOrDataResponse.feeQuotes as PaymasterFeeQuote[];
    const spender: Hex = feeQuotesOrDataResponse.tokenPaymasterAddress || "0x";

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

    userOpResponse = await smartWallet.sendTransaction(transaction, {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        feeQuote: selectedFeeQuote,
        spender,
        maxApproval: false,
      },
    });
  } else if (feeQuotesOrDataResponse.paymasterAndData) {
    // this means sponsorship is successful
    userOpResponse = await smartWallet.sendTransaction(transaction, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });
  }

  console.log(chalk.green(`userOp Hash: ${userOpResponse!.userOpHash}`));
  const transactionDetails = await userOpResponse!.wait();
  console.log(
    chalk.blue(
      `transactionDetails: ${JSON.stringify(transactionDetails, null, "\t")}`
    )
  );
};
