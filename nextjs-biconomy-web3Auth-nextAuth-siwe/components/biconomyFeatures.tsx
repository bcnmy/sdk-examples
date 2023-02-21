import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { FC } from "react";

const SignMessage = dynamic(() => import("./signMessage"), { ssr: false });
const GasslessTx = dynamic(() => import("./gasslessTx"), { ssr: false });

const BiconomyFeatures: FC = () => {
  const { data: session } = useSession();

  return session ? (
    <div style={{ textAlign: "center" }}>
      <h1>Biconomy Features</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SignMessage />
        <GasslessTx />
      </Suspense>
    </div>
  ) : null;
};

export default BiconomyFeatures;
