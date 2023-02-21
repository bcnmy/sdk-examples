import { useState } from "react";
import useBiconomyStore from "../store/useBiconomyStore";

const SignMessage = () => {
  const smartAccountAddress = useBiconomyStore.use.smartAccountAddress();
  const createSignature = async () => {
    const signature = await window.biconomySmartAccount
      ?.getsigner()
      ?.signMessage("Hello World");
    console.log({ signature });
    setSignature(signature);
    return signature;
  };
  const [signature, setSignature] = useState<string | undefined>(undefined);
  return (
    (smartAccountAddress && (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ margin: "auto" }}>
          <button onClick={createSignature}>Sign message Hello World</button>
        </div>
        <div style={{ margin: "auto" }}>
          {signature && (
            <div style={{ paddingBottom: "2rem" }}>Signature: {signature}</div>
          )}
        </div>
      </div>
    )) ||
    null
  );
};

export default SignMessage;
