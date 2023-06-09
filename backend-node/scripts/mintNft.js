const { ethers } = require("ethers");
const { createBiconomyAccountInstance, buildAndSendUserOp } = require('./helperFunctions')

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

  // Sending transaction
  buildAndSendUserOp(biconomySmartAccount, transaction)
}

module.exports = { mintNft };