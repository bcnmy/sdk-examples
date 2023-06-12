const { ethers } = require("ethers");
const { createBiconomyAccountInstance, buildAndSendUserOp } = require('./helperFunctionsBtpm')

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

  const partialUserOp = await biconomySmartAccount.buildUserOp([transaction])

  const feeQuotes = await tokenPaymaster?.getPaymasterFeeQuotes(partialUserOp, ["0xda5289fcaaf71d52a80a254da614a192b693e977", "0x27a44456bedb94dbd59d0f0a14fe977c777fc5c3"])
  console.log('<<<<<<<<<<<<<<<<<< ====================== fee quotes received')
  console.log(feeQuotes)

  // Sending transaction
  // buildAndSendUserOp(biconomySmartAccount, transaction)
}

module.exports = { mintNftPayERC20 };