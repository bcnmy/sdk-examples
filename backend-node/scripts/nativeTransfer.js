const { ethers } = require("ethers");
const { createBiconomyAccountInstance, buildAndSendUserOp } = require('./helperFunctions')

const nativeTransfer = async (to, amount) => {
  const biconomySmartAccount = await createBiconomyAccountInstance()

  // transfer native asset
  const transaction = {
    to: to || "0x0000000000000000000000000000000000000000",
    data: "0x",
    value: ethers.utils.parseEther(amount.toString()),
  }
  // Sending transaction
  buildAndSendUserOp(biconomySmartAccount, transaction)
}

module.exports = { nativeTransfer };