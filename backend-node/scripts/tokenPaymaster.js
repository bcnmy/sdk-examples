const { ethers } = require("ethers");
const { createBiconomyAccountInstance, buildAndSendUserOp, sendUserOp } = require('./helperFunctions')

const mintNftPayERC20 = async () => {
  try{
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

  console.log('partial userOp')
  console.log(partialUserOp)
  
  const feeQuotesResponse = await biconomyPaymaster?.getPaymasterFeeQuotesOrData(partialUserOp, { mode: "ERC20", tokenInfo:{tokenList: ["0xda5289fcaaf71d52a80a254da614a192b693e977", "0x27a44456bedb94dbd59d0f0a14fe977c777fc5c3"], preferredToken: "0xda5289fcaaf71d52a80a254da614a192b693e977"}})
  console.log('<<<<<<<<<<<<<<<<<< ====================== fee quotes received ====================== >>>>>>>>>>>>>>>>>>>')
  const feeQuotes = feeQuotesResponse.feeQuotes
  console.log(feeQuotes)

  const spender = feeQuotesResponse.tokenPaymasterAddress
  console.log('paymaster to give approval to ', spender)

  console.log(feeQuotes[0].tokenAddress)

  // pm_getFeeQuoteOrData
  let finalUserOp = await biconomySmartAccount.buildTokenPaymasterUserOp(partialUserOp, {feeQuote: feeQuotes[0], spender:spender, maxApproval: false})
  console.log('updated userop ', finalUserOp)

  const paymasterServiceData = 
    {
      "mode": "ERC20",
      "calculateGasLimits": true,
      "tokenInfo": 
      {
      "feeTokenAddress": feeQuotes[0].tokenAddress // sending 0th quote now
      }
    }
  
  // pm_sponsorUserOp
  const paymasterAndDataWithLimits  = await biconomyPaymaster?.getPaymasterAndData(finalUserOp, paymasterServiceData);
  console.log('successfull call return: paymasterAndDataWithLimits ', paymasterAndDataWithLimits)

  finalUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData
  finalUserOp.callGasLimit = paymasterAndDataWithLimits.callGasLimit
  finalUserOp.verificationGasLimit = paymasterAndDataWithLimits.verificationGasLimit
  finalUserOp.preVerificationGas = paymasterAndDataWithLimits.preVerificationGas

  await sendUserOp(biconomySmartAccount, finalUserOp)
  } catch (e) {
    console.log('error received ', e)
  }
}

module.exports = { mintNftPayERC20 };