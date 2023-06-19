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

  const biconomyPaymaster = biconomySmartAccount.paymaster;
  // todo
  // instead of using attached paymaster create BTPM instance

  let partialUserOp = await biconomySmartAccount.buildUserOp([transaction])

  console.log('partial userOp')
  console.log(partialUserOp)
  
  const feeQuotesResponse = await biconomyPaymaster?.getPaymasterFeeQuotes(partialUserOp, ["0xda5289fcaaf71d52a80a254da614a192b693e977", "0x27a44456bedb94dbd59d0f0a14fe977c777fc5c3"], "0xda5289fcaaf71d52a80a254da614a192b693e977")
  console.log('<<<<<<<<<<<<<<<<<< ====================== fee quotes received')
  const feeQuotes = feeQuotesResponse.feeQuotes
  console.log(feeQuotes)

  const spender = feeQuotesResponse.tokenPaymasterAddress
  console.log('paymaster to give approval to ', spender)

  console.log(feeQuotes[0].tokenAddress)

  let finalUserOp = await biconomySmartAccount.buildTokenPaymasterUserOp(partialUserOp, {feeQuote: feeQuotes[0], spender:spender, maxApproval: false})
  console.log('updated userop ', finalUserOp)

  const paymasterServiceData = 
    {
      "mode": "ERC20",
      "tokenInfo": 
      {
      "feeTokenAddress": feeQuotes[0].tokenAddress // for now or always
      },
      /*
      sponsorshipInfo: {
        "webhookData": {},
        "smartAccountInfo": {
            "name": "BICONOMY",
            "version": "1.0.0"
        }
      }*/
    }
  
  const paymasterData = await biconomyPaymaster?.getPaymasterAndData(finalUserOp, paymasterServiceData);
  console.log('successfull call return: paymasterAndData ', paymasterData)

  finalUserOp.paymasterAndData = paymasterData

  // Sending transaction
  // const userOpResponse = await biconomySmartAccount.sendUserOp(partialUserOp)
  // console.log('userOpResponse ', userOpResponse)

  await sendUserOp(biconomySmartAccount, finalUserOp)


    
  
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