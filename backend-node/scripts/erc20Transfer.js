const { ethers } = require("ethers");
const { createBiconomyAccountInstance, sendUserOp } = require('./helperFunctions')

const erc20Transfer = async (recipientAddress, amount, tokenAddress) => {
  const biconomySmartAccount = await createBiconomyAccountInstance()

  // transfer ERC-20 tokens to recipient
  const erc20Interface = new ethers.utils.Interface([
    'function transfer(address _to, uint256 _value)'
  ])
  // Encode an ERC-20 token transfer to recipient of the specified amount
  const amountGwei = ethers.utils.parseUnits(amount.toString(), 6); // TODO // review assuming it's USDC on Mumbai and decimals are 6
  const data = erc20Interface.encodeFunctionData(
    'transfer', [recipientAddress, amountGwei]
  )
  const transaction = {
    to: tokenAddress,
    data
  }
  const biconomyPaymaster = biconomySmartAccount.paymaster;

  let partialUserOp = await biconomySmartAccount.buildUserOp([transaction])

  const paymasterServiceData = {
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

  // console.log('partialUserOp is ', partialUserOp)

  try{
  const paymasterAndDataWithLimits = await biconomyPaymaster?.getPaymasterFeeQuotesOrData(partialUserOp, paymasterServiceData);
  console.log('successfull call return: paymasterAndDataWithLimits ', paymasterAndDataWithLimits)
  
  partialUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData
  if(paymasterAndDataWithLimits.callGasLimit && paymasterAndDataWithLimits.verificationGasLimit && paymasterAndDataWithLimits.preVerificationGas) {
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