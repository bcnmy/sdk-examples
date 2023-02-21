import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import useBiconomyStore from "../store/useBiconomyStore";
import GasslessTx from "../components/gasslessTx";
import SignMessage from "../components/signMessage";

const Index = () => {
  const SocialLoginDynamic = dynamic(
    () => import("../components/scw").then((res) => res.default),
    {
      ssr: false,
    }
  );
  const smartAccountLoading = useBiconomyStore.use.smartAccountLoading();
  const smartAccountAddress = useBiconomyStore.use.smartAccountAddress();

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <SocialLoginDynamic />
      </Suspense>
      {!smartAccountLoading && smartAccountAddress && (
        <div>
          <SignMessage />
          <GasslessTx />
        </div>
      )}
    </div>
  );
};

export default Index;
