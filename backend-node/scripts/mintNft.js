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
  const nftAddress = "0xdd526eba63ef200ed95f0f0fb8993fe3e20a23d0" // same for goerli and mumbai
  const transaction = {
    to: nftAddress,
    data: data,
  }

  /*const biconomyPaymaster =  new BiconomyPaymaster({
    paymasterUrl: config.biconomyPaymasterUrl,
  })*/

  const biconomyPaymaster = biconomySmartAccount.paymaster;

  console.log('verifying paymaster ', biconomyPaymaster)

  console.log('biconomySmartAccount.paymaster ', biconomySmartAccount.paymaster)

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

  console.log('partialUserOp is ')
  console.log(partialUserOp)

  // const paymasterData = await biconomyPaymaster?.getPaymasterAndData(partialUserOp, paymasterServiceData);
  // console.log('successfull call return: paymasterAndData ', paymasterData)

  const paymasterAndDataWithLimits = await biconomyPaymaster?.getPaymasterFeeQuotesOrData(partialUserOp, paymasterServiceData);
  console.log('successfull call return: paymasterAndDataWithLimits ', paymasterAndDataWithLimits)

  partialUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData
  partialUserOp.callGasLimit = paymasterAndDataWithLimits.callGasLimit
  partialUserOp.verificationGasLimit = paymasterAndDataWithLimits.verificationGasLimit
  partialUserOp.preVerificationGas = paymasterAndDataWithLimits.preVerificationGas

  await sendUserOp(biconomySmartAccount, partialUserOp)
}

module.exports = { mintNft };