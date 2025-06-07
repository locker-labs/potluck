import { useConnect, useAccount } from "wagmi";
import sdk from "@farcaster/frame-sdk";

export function useConnection() {
    const { isConnected } = useAccount();
    const { connectAsync, connectors } = useConnect();

    const ensureConnection = async () => {
        if (!isConnected) {
          if (!(await sdk.context)) {
            await connectAsync({ connector: connectors[1] }); // metamask
          } else {
            await connectAsync({ connector: connectors[0] }); // farcaster frame
          }
        }
    }

    return { ensureConnection };
}