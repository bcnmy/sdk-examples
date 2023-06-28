const { ethers } = require("ethers");
const { createBiconomyAccountInstance, buildAndSendUserOp, sendUserOp } = require('./helperFunctions')
const { BiconomyPaymaster } = require("@biconomy/paymaster")
const config = require("../config.json");

const mintNft = async () => {
  const biconomySmartAccount = await createBiconomyAccountInstance()

  const nftInterface = new ethers.utils.Interface([
    'function safeMint(address _to)'
  ])
  const data = nftInterface.encodeFunctionData(
    'safeMint', [biconomySmartAccount.address]
  )
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e" // same for goerli and mumbai
  const transaction = {
    to: nftAddress,
    data: data,
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
  partialUserOp.callGasLimit = paymasterAndDataWithLimits.callGasLimit
  partialUserOp.verificationGasLimit = paymasterAndDataWithLimits.verificationGasLimit
  partialUserOp.preVerificationGas = paymasterAndDataWithLimits.preVerificationGas
  await sendUserOp(biconomySmartAccount, partialUserOp)
} catch (e) {
  console.log('error received ', e)
}
}

module.exports = { mintNft };