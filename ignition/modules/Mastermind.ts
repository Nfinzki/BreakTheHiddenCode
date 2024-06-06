import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DISPUTE_WINDOW = 10;
const AFK_WINDOW = 10;

const MastermindModule = buildModule("LockModule", (m) => {
  const disputeWindow = m.getParameter("disputeWindow", DISPUTE_WINDOW);
  const afkWindow = m.getParameter("afkWindow", AFK_WINDOW);

  const mastermind = m.contract("Mastermind", [disputeWindow, afkWindow]);

  return { mastermind };
});

export default MastermindModule;