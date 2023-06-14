const { ethers } = require("ethers");
const { createBiconomyAccountInstance, buildAndSendUserOp, sendUserOp } = require('./helperFunctionsBtpm')

const mintNftPayERC20 = async () => {
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

  const tokenPaymaster = biconomySmartAccount.paymaster;
  // todo
  // instead of using attached paymaster create BTPM instance

  let partialUserOp = await biconomySmartAccount.buildUserOp([transaction])
  
  const feeQuotes = await tokenPaymaster?.getPaymasterFeeQuotes(partialUserOp, ["0xda5289fcaaf71d52a80a254da614a192b693e977", "0x27a44456bedb94dbd59d0f0a14fe977c777fc5c3"], "0xda5289fcaaf71d52a80a254da614a192b693e977")
  console.log('<<<<<<<<<<<<<<<<<< ====================== fee quotes received')
  // console.log(feeQuotes)

  console.log(feeQuotes[0].tokenAddress)

  const paymasterServiceData = 
    {
      "tokenPaymasterData": 
      {
      "feeTokenAddress": feeQuotes[0].tokenAddress // for now or always
      }
    }

  console.log('partialUserOp is ')
  console.log(partialUserOp)
  
  const paymasterData = await tokenPaymaster?.getPaymasterAndData(partialUserOp, paymasterServiceData);
  console.log('successfull call return: paymasterAndData ', paymasterData)

  partialUserOp.paymasterAndData = paymasterData

  // Sending transaction
  // const userOpResponse = await biconomySmartAccount.sendUserOp(partialUserOp)
  // console.log('userOpResponse ', userOpResponse)

  sendUserOp(biconomySmartAccount, partialUserOp)


    
  
  ///////////////////////////////////////


  // 1. 
  // Pass the partialUserOp and feeTokenAddress (mandatory quote) to account package for updating calldata with approval
  // Pass the partial userOp and tokenAddress/Quote to tokenPaymaster.getPaymasterAndData()
  // update the partialUserOp with paymasterandData and sendUserOp to bundler

  // 2.
  // Pass the partialUserOp and preferredTokenAddress
  // get the fee quote for your preferred token by tokenPaymaster.getFeeQuote()
  // Manage appending approval to calldata on your end [ In order to do this you need : tokenAddress, spender, quote (or choose infinite approval)]
  // Pass the updated partial userOp and tokenAddress/Quote to tokenPaymaster.getPaymasterAndData()
  // update the partialUserOp with paymasterandData and sendUserOp to bundler



  // Sending transaction
  // buildAndSendUserOp(biconomySmartAccount, transaction)
}

module.exports = { mintNftPayERC20 };