// https://biconomy.gitbook.io/sdk/sdk-reference/sending-transactions/gasless-transactions/sending-erc-721-nft-tokens
import { ethers } from "ethers";
import { useState } from "react";
import useBiconomyStore from "../store/useBiconomyStore";


const GasslessTx = () => {
  const [successMsg, setSuccessMsg] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  const smartAccountAddress = useBiconomyStore.use.smartAccountAddress();

  const sendNFT = async () => {
    const smartAccount = window.biconomySmartAccount;
    if (!smartAccount) return;
    // dummy poly address
    const recipientAddress = "0x0000000000000000000000000000000000000000";
    // test poly contract address
    const nftAddress = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619";
    const tokenId = 0;
    const erc721Interface = new ethers.utils.Interface([
      "function safeTransferFrom(address _from, address _to, uint256 _tokenId)",
    ]);
    // Encode an ERC-721 token transfer to recipient of the specified amount
    const data = erc721Interface.encodeFunctionData("safeTransferFrom", [
      smartAccountAddress,
      recipientAddress,
      tokenId,
    ]);
    const tx1 = {
      to: nftAddress,
      data,
    };
    // Transaction subscription
    smartAccount.on("txHashGenerated", (response: any) => {
      console.log("txHashGenerated event received via emitter", response);
      setSuccessMsg(`Transaction sent: ${response.hash}`);
    });
    smartAccount.on("txMined", (response: any) => {
      console.log("txMined event received via emitter", response);
      setSuccessMsg(`Transaction mined: ${response.hash}`);
    });
    smartAccount.on("error", (response: any) => {
      setErrorMsg(
        `error event received via emitter: ${JSON.stringify(response)}`
      );
    });
    // Sending transaction
    // Gasless
    const txResponse = await smartAccount.sendGaslessTransaction({
      transaction: tx1,
    });
    console.log("txResponse", txResponse);
  };
  return smartAccountAddress && (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ margin: "auto" }}>
        <button onClick={sendNFT}>Send NFT</button>
      </div>
      <div style={{ margin: "auto" }}>
        {successMsg && <p>{successMsg}</p>}
        {errorMsg && <p>{errorMsg}</p>}
      </div>
    </div>
  ) || null;
};

export default GasslessTx;
