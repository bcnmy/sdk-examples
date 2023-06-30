import { ethers } from "ethers";
import inquirer from "inquirer";
import { createBiconomyAccountInstance, sendUserOp } from "./helperFunctions";

export const batchMintNft = async (withTokenPaymaster: boolean) => {
  const biconomySmartAccount = await createBiconomyAccountInstance();

  // generate mintNft data
  const nftInterface = new ethers.utils.Interface([
    "function safeMint(address _to)",
  ]);
  const data = nftInterface.encodeFunctionData("safeMint", [
    await biconomySmartAccount.getSmartAccountAddress(),
  ]);
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"; // same for goerli and mumbai
  const transaction = {
    to: nftAddress,
    data: data,
  };

  // build partial userOp and paymaster data of verifying
  const biconomyPaymaster = biconomySmartAccount.paymaster;
  let partialUserOp = await biconomySmartAccount.buildUserOp([
    transaction,
    transaction,
  ]);
  let finalUserOp = partialUserOp;
  let paymasterServiceData = {
    mode: "SPONSORED",
    calculateGasLimits: true,
    sponsorshipInfo: {
      webhookData: {},
      smartAccountInfo: {
        name: "BICONOMY",
        version: "1.0.0",
      },
    },
  };
  // if withTokenPaymaster is true, then get fee quotes and ask user to select one
  if (withTokenPaymaster) {
    const feeQuotesResponse =
      await biconomyPaymaster?.getPaymasterFeeQuotesOrData(partialUserOp, {
        mode: "ERC20",
        // tokenInfo: {
        //   tokenList: [
        //     "0xda5289fcaaf71d52a80a254da614a192b693e977",
        //     "0x27a44456bedb94dbd59d0f0a14fe977c777fc5c3",
        //   ],
        //   // preferredToken: "0xda5289fcaaf71d52a80a254da614a192b693e977"
        // },
      });
    const feeQuotes = feeQuotesResponse.feeQuotes;
    const spender = feeQuotesResponse.tokenPaymasterAddress;

    // Generate list of options for the user to select
    const choices = feeQuotes.map((quote: any, index: number) => ({
      name: `Option ${index + 1}: ${quote.symbol}`,
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
    // pm_getFeeQuoteOrData
    finalUserOp = await biconomySmartAccount.buildTokenPaymasterUserOp(
      partialUserOp,
      {
        feeQuote: selectedFeeQuote,
        spender: spender,
        maxApproval: false,
      }
    );

    paymasterServiceData = {
      mode: "ERC20",
      calculateGasLimits: true,
      tokenInfo: {
        feeTokenAddress: selectedFeeQuote.tokenAddress,
      },
    };
  }

  try {
    const paymasterAndDataWithLimits =
      await biconomyPaymaster?.getPaymasterAndData(
        partialUserOp,
        paymasterServiceData
      );

    partialUserOp.paymasterAndData =
      paymasterAndDataWithLimits.paymasterAndData;
    if (
      paymasterAndDataWithLimits.callGasLimit &&
      paymasterAndDataWithLimits.verificationGasLimit &&
      paymasterAndDataWithLimits.preVerificationGas
    ) {
      partialUserOp.callGasLimit = paymasterAndDataWithLimits.callGasLimit;
      partialUserOp.verificationGasLimit =
        paymasterAndDataWithLimits.verificationGasLimit;
      partialUserOp.preVerificationGas =
        paymasterAndDataWithLimits.preVerificationGas;
    }
    await sendUserOp(biconomySmartAccount, partialUserOp);
  } catch (e) {
    console.log("error received ", e);
  }
};
