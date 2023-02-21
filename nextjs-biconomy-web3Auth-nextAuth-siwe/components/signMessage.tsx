import { useState } from "react";

const SignMessage = () => {
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
  );
};

export default SignMessage;
