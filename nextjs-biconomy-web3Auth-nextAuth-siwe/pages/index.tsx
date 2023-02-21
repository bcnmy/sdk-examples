import dynamic from "next/dynamic";
import { Suspense, useState } from "react";

const Index = () => {
  const SocialLoginDynamic = dynamic(
    () => import("../components/scw").then((res) => res.default),
    {
      ssr: false,
    }
  );

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
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <SocialLoginDynamic />
      </Suspense>
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
          {signature && <div>Signature: {signature}</div>}
        </div>
      </div>
    </div>
  );
};

export default Index;
