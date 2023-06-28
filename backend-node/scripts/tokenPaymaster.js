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
  
  const feeQuotesResponse = await biconomyPaymaster?.getPaymasterFeeQuotesOrData(partialUserOp, { mode: "ERC20", tokenInfo:{tokenList: ["0x355c8c8395fadf2eaa6bb27f86e53e432e3de4e6", "0x03bbb5660b8687c2aa453a0e42dcb6e0732b1266", "0x1ffa9c87ead57adc9e4f9a7d26ec3a52150db3b0", "0x81f9e7a56f6869a9a8c385d1e0701b312439501f", "0xdeb12ea437c116ed823ab49244cafec4e41704cb"], preferredToken: "0x355c8c8395fadf2eaa6bb27f86e53e432e3de4e6"}})
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