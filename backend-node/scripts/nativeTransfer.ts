import { ethers } from "ethers";
import inquirer from "inquirer";
import {
  IHybridPaymaster,
  PaymasterFeeQuote,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy-devx/paymaster";
import { createBiconomyAccountInstance, sendUserOp } from "./helperFunctions";
import config from "../config.json";

export const nativeTransfer = async (
  to: string,
  amount: number,
  withTokenPaymaster: boolean
) => {
  const biconomySmartAccount = await createBiconomyAccountInstance();

  // transfer native asset
  const transaction = {
    to: to || "0x0000000000000000000000000000000000000000",
    data: "0x",
    value: ethers.utils.parseEther(amount.toString()),
  };

  // build partial userOp and paymaster data of verifying
  const biconomyPaymaster =
    biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
  let partialUserOp = await biconomySmartAccount.buildUserOp([transaction]);
  console.log("partialUserOp.callData", partialUserOp.callData);
  let finalUserOp = partialUserOp;
  let paymasterServiceData: SponsorUserOperationDto = {
    mode: PaymasterMode.SPONSORED,
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
      await biconomyPaymaster.getPaymasterFeeQuotesOrData(partialUserOp, {
        mode: PaymasterMode.ERC20,
        tokenInfo: {
          tokenList: config.tokenList ? config.tokenList : [],
          preferredToken: config.preferredToken,
        },
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
      mode: PaymasterMode.ERC20,
      calculateGasLimits: true,
      tokenInfo: {
        feeTokenAddress: selectedFeeQuote.tokenAddress,
      },
    };
  }

  try {
    const paymasterAndDataWithLimits =
      await biconomyPaymaster.getPaymasterAndData(
        finalUserOp,
        paymasterServiceData
      );
    finalUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData;
    if (
      paymasterAndDataWithLimits.callGasLimit &&
      paymasterAndDataWithLimits.verificationGasLimit &&
      paymasterAndDataWithLimits.preVerificationGas
    ) {
      finalUserOp.callGasLimit = paymasterAndDataWithLimits.callGasLimit;
      finalUserOp.verificationGasLimit =
        paymasterAndDataWithLimits.verificationGasLimit;
      finalUserOp.preVerificationGas =
        paymasterAndDataWithLimits.preVerificationGas;
    }
    await sendUserOp(biconomySmartAccount, finalUserOp);
  } catch (e) {
    console.log("error received ", e);
  }
};