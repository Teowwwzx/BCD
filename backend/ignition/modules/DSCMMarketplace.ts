import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DSCMMarketplaceModule = buildModule("DSCMMarketplaceModule", (m) => {
  const marketplace = m.contract("DSCMMarketplace");

  return { marketplace };
});

export default DSCMMarketplaceModule;