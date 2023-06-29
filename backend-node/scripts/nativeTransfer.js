const { ethers } = require("ethers");
const { createBiconomyAccountInstance, sendUserOp } = require('./helperFunctions')

const nativeTransfer = async (to, amount) => {
  const biconomySmartAccount = await createBiconomyAccountInstance()

  // transfer native asset
  const transaction = {
    to: to || "0x0000000000000000000000000000000000000000",
    data: "0x",
    value: ethers.utils.parseEther(amount.toString()),
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

module.exports = { nativeTransfer };