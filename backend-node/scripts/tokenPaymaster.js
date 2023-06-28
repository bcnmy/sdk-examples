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
  
  const feeQuotesResponse = await biconomyPaymaster?.getPaymasterFeeQuotesOrData(partialUserOp, { mode: "ERC20", tokenInfo:{tokenList: ["0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", "0x55d398326f99059fF775485246999027B3197955", "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", "0xfb6115445Bff7b52FeB98650C87f44907E58f802", "0x111111111117dC0aa78b770fA6A738034120C302", "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD", "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x4b0f1812e5df2a09796481ff14017e6005508003"], preferredToken: "0x4b0f1812e5df2a09796481ff14017e6005508003"}})
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