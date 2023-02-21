import dynamic from "next/dynamic";
import { Suspense } from "react";
import BiconomyFeatures from "../components/biconomyFeatures";

const Index = () => {
  // we need to instantiate this component dynamically to avoid SSR,
  // otherwise we get an issue with window and the generated code from biconomy
  const SocialLoginDynamic = dynamic(() => import("../components/scw"), {
    ssr: false,
  });

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <SocialLoginDynamic />
      </Suspense>
      <BiconomyFeatures />
    </div>
  );
};

export default Index;
