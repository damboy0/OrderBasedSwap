import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SwapModule = buildModule("SwapModule", (m) => {

    const save = m.contract("Swap");

    return { save };
});

export default SwapModule;