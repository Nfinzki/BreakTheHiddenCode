import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BreakTheHiddenCodeModule = buildModule("BreakTheHiddenCodeModule", (m) => {

  const breakTheHiddenCode = m.contract("BreakTheHiddenCode");

  return { breakTheHiddenCode };
});

export default BreakTheHiddenCodeModule;
