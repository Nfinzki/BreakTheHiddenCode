import {
    time,
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("BreakTheHiddenCode", function () {
    async function deployBreakTheHiddenCodeFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const BreakTheHiddenCode = await hre.ethers.getContractFactory("BreakTheHiddenCode");
        const breakTheHiddenCode = await BreakTheHiddenCode.deploy();

        const nullAddress = "0x0000000000000000000000000000000000000000";

        return { breakTheHiddenCode, nullAddress, account1, account2, account3 };
    }

    async function deployBthcAndCreateAGameWithSpecificOpponentFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const BreakTheHiddenCode = await hre.ethers.getContractFactory("BreakTheHiddenCode");
        const breakTheHiddenCode = await BreakTheHiddenCode.deploy();

        const nullAddress = "0x0000000000000000000000000000000000000000";

        await breakTheHiddenCode["createGame(address)"](account2);

        return { breakTheHiddenCode, nullAddress, account1, account2, account3 };
    }

    describe("Game creation", function () {
        it("Should create a game with gameId equal to 0 and the creator of the game is the only one connected", async function () {
            const { breakTheHiddenCode, account1, nullAddress } = await loadFixture(deployBreakTheHiddenCodeFixture);

            const createGameResposnse = breakTheHiddenCode["createGame()"]();

            await expect(createGameResposnse)
                .to.emit(breakTheHiddenCode, "GameCreated")
                .withArgs(0);

            expect(await breakTheHiddenCode.games("0", "0")).to.equal(account1.address);
            expect(await breakTheHiddenCode.games("0", "1")).to.equal(nullAddress);
            expect(await breakTheHiddenCode.games("0", "2")).to.equal(nullAddress);
        });

        it("Should create a game for a specific opponent with gameId equal to 0 and in the mapping is present the creator (pos. 0) and the invited account (pos. 2)", async function () {
            const { breakTheHiddenCode, account1, account2, nullAddress} = await loadFixture(deployBreakTheHiddenCodeFixture);

            await expect(breakTheHiddenCode["createGame(address)"](account2))
                .to.emit(breakTheHiddenCode, "GameCreatedForAnOpponent")
                .withArgs(0, account2);

            expect(await breakTheHiddenCode.games("0", "0")).to.equal(account1.address);
            expect(await breakTheHiddenCode.games("0", "1")).to.equal(nullAddress);
            expect(await breakTheHiddenCode.games("0", "2")).to.equal(account2);
        });

        it("Should fail with opponent address null", async function () {
            const { breakTheHiddenCode, nullAddress} = await loadFixture(deployBreakTheHiddenCodeFixture);

            await expect(breakTheHiddenCode["createGame(address)"](nullAddress))
                .to.be.revertedWith(
                    "Invalid opponent address"
                );
        });

        it("Should fail with opponent address equal to the sender address", async function () {
            const { breakTheHiddenCode, account1} = await loadFixture(deployBreakTheHiddenCodeFixture);

            await expect(breakTheHiddenCode["createGame(address)"](account1))
                .to.be.revertedWith(
                    "Can't create a game with yourself"
                );
        })
    });

    describe("Join game", function () {
        it("Should emit the event that the designated opponent joined", async function() {
            const { breakTheHiddenCode, account2 } = await loadFixture(deployBthcAndCreateAGameWithSpecificOpponentFixture);

            await expect(breakTheHiddenCode.connect(account2).joinGameById(0))
                .to.emit(breakTheHiddenCode, "UserJoined");
        });

        it("Should fail because there are no existing game", async function() {
            const { breakTheHiddenCode, account2 } = await loadFixture(deployBreakTheHiddenCodeFixture);

            await expect(breakTheHiddenCode.connect(account2).joinGameById(0))
                .to.be.revertedWith(
                    "Currently there are no existing games"
                );
        });

        it("Should fail because the provided game doesn not exist", async function() {
            const { breakTheHiddenCode, account2 } = await loadFixture(deployBthcAndCreateAGameWithSpecificOpponentFixture);

            await expect(breakTheHiddenCode.connect(account2).joinGameById(1))
                .to.be.revertedWith(
                    "Game doesn't exists"
                );
        });

        it("Should fail because the address is not authorized to join", async function() {
            const { breakTheHiddenCode, account2, account3 } = await loadFixture(deployBthcAndCreateAGameWithSpecificOpponentFixture);

            await expect(breakTheHiddenCode.connect(account3).joinGameById(0))
                .to.be.revertedWith(
                    "Not authorized to join the game"
                );
        });
    });
});
