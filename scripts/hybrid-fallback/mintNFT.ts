import { ethers } from "ethers";
const chalk = require("chalk");
import inquirer from "inquirer";
import {
  createSmartWalletClient,
  PaymasterMode,
  IHybridPaymaster,
  PaymasterFeeQuote,
  SponsorUserOperationDto,
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
  const smartWallet = await createSmartWalletClient({
    signer,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
    bundlerUrl: config.bundlerUrl,
  });

  // ------------------------STEP 2: Build Partial User op from your user Transaction/s Request --------------------------------//

  // generate mintNft data
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

  // build partial userOp
  let partialUserOp = await smartWallet.buildUserOp([transaction]);

  let finalUserOp = partialUserOp;

  // ------------------------STEP 3: Get direct paymasterAndData or Fee quotes (floating mode) from the paymaster--------------------------------//

  const Paymaster =
    smartWallet.paymaster as IHybridPaymaster<SponsorUserOperationDto>;

  const feeQuotesOrDataResponse = await Paymaster.getPaymasterFeeQuotesOrData(
    partialUserOp,
    {
      // here we are leaving the mode open

      // one can pass tokenList empty array. and it would return fee quotes for all tokens supported by the Biconomy paymaster
      // this will only be considered if gasless sponsorship policy check fails
      tokenList: config.tokenList ? config.tokenList : [],

      // preferredToken is optional. If you want to pay in a specific token, you can pass its address here and get fee quotes for that token only
      // this will only be considered if gasless sponsorship policy check fails
      preferredToken: config.preferredToken,
    }
  );

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

    finalUserOp = await smartWallet.setPaymasterUserOp(finalUserOp, {
      mode: PaymasterMode.ERC20,
      feeQuote: selectedFeeQuote,
      spender,
      maxApproval: false,
    })
  } else if (feeQuotesOrDataResponse.paymasterAndData) {
    // this means sponsorship is successful
    finalUserOp = await smartWallet.setPaymasterUserOp(finalUserOp, {mode: PaymasterMode.SPONSORED})
  }

  // ------------------------STEP 4: Sign the UserOp and send to the Bundler--------------------------------//

  console.log(chalk.blue(`userOp: ${JSON.stringify(finalUserOp, null, "\t")}`));

  // Below function gets the signature from the user (signer provided in Biconomy Smart Account)
  // and also send the full op to attached bundler instance

  try {
    const userOpResponse = await smartWallet.sendUserOp(finalUserOp);
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
