const { ethers } = require("ethers");
const { createBiconomyAccountInstance, buildAndSendUserOp } = require('./createInstance')

const erc20Transfer = async (recipientAddress, amount, tokenAddress) => {
  const biconomySmartAccount = await createBiconomyAccountInstance()

  // transfer ERC-20 tokens to recipient
  const erc20Interface = new ethers.utils.Interface([
    'function transfer(address _to, uint256 _value)'
  ])
  // Encode an ERC-20 token transfer to recipient of the specified amount
  const amountGwei = ethers.parseUnits(amount, 6);
  const data = erc20Interface.encodeFunctionData(
    'transfer', [recipientAddress, amountGwei]
  )
  const transaction = {
    to: tokenAddress,
    data
  }
  // Sending transaction
  buildAndSendUserOp(biconomySmartAccount, transaction)
}

module.exports = { erc20Transfer };