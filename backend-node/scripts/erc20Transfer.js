const { ethers } = require("ethers");
const inquirer = require('inquirer');
const { createBiconomyAccountInstance, sendUserOp } = require('./helperFunctions')

const erc20Transfer = async (recipientAddress, amount, tokenAddress, withTokenPaymaster) => {
  const biconomySmartAccount = await createBiconomyAccountInstance()

  // transfer ERC-20 tokens to recipient
  const erc20Interface = new ethers.utils.Interface([
    'function transfer(address _to, uint256 _value)'
  ])
  // Encode an ERC-20 token transfer to recipient of the specified amount
  const amountGwei = ethers.utils.parseUnits(amount.toString(), 6); // TODO: if it's USDC on Mumbai and decimals are 6
  const data = erc20Interface.encodeFunctionData(
    'transfer', [recipientAddress, amountGwei]
  )
  const transaction = {
    to: tokenAddress,
    data
  }
  // build partial userOp and paymaster data of verifying
  const biconomyPaymaster = biconomySmartAccount.paymaster;
  let partialUserOp = await biconomySmartAccount.buildUserOp([transaction])
  let finalUserOp = partialUserOp
  let paymasterServiceData = {
    "mode": "SPONSORED",
    "calculateGasLimits": true,
    "sponsorshipInfo": {
      "webhookData": {},
      "smartAccountInfo": {
        "name": "BICONOMY",
        "version": "1.0.0"
      }
    }
  }
  // if withTokenPaymaster is true, then get fee quotes and ask user to select one
  if (withTokenPaymaster) {
    const feeQuotesResponse = await biconomyPaymaster?.getPaymasterFeeQuotesOrData(partialUserOp, {
      mode: "ERC20",
      tokenInfo: {
        tokenList: ["0xda5289fcaaf71d52a80a254da614a192b693e977", "0x27a44456bedb94dbd59d0f0a14fe977c777fc5c3"],
        // preferredToken: "0xda5289fcaaf71d52a80a254da614a192b693e977"
      }
    })
    const feeQuotes = feeQuotesResponse.feeQuotes
    const spender = feeQuotesResponse.tokenPaymasterAddress

    // Generate list of options for the user to select
    const choices = feeQuotes.map((quote, index) => ({
      name: `Option ${index + 1}: ${quote.symbol}`,
      value: index
    }));
    // Use inquirer to prompt user to select an option
    const { selectedOption } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedOption',
      message: 'Select a fee quote:',
      choices
    }]);
    const selectedFeeQuote = feeQuotes[selectedOption];
    // pm_getFeeQuoteOrData
    finalUserOp = await biconomySmartAccount.buildTokenPaymasterUserOp(partialUserOp, {
      feeQuote: selectedFeeQuote,
      spender: spender,
      maxApproval: false
    })

    paymasterServiceData = {
      "mode": "ERC20",
      "calculateGasLimits": true,
      "tokenInfo": {
        "feeTokenAddress": selectedFeeQuote.tokenAddress
      }
    }
  }

  try {
    const paymasterAndDataWithLimits = await biconomyPaymaster?.getPaymasterAndData(partialUserOp, paymasterServiceData);

    partialUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData
    if (paymasterAndDataWithLimits.callGasLimit && paymasterAndDataWithLimits.verificationGasLimit && paymasterAndDataWithLimits.preVerificationGas) {
      partialUserOp.callGasLimit = paymasterAndDataWithLimits.callGasLimit
      partialUserOp.verificationGasLimit = paymasterAndDataWithLimits.verificationGasLimit
      partialUserOp.preVerificationGas = paymasterAndDataWithLimits.preVerificationGas
    }
    await sendUserOp(biconomySmartAccount, partialUserOp)
  } catch (e) {
    console.log('error received ', e)
  }
}

module.exports = { erc20Transfer };