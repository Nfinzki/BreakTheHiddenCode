import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { extendEnvironment } from "hardhat/config";

describe("PokerBettingProtocol", function () {
    async function deployPokerBettingProtocolFixture() {
        const [account1, account2, account3, account4, breakTheHiddenCodeAddress] = await hre.ethers.getSigners();

        const betIndex = 0;
        const betIndex2 = 1;

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        return { pokerBettingProtocol, nullAddress, account1, account2, account3, account4, breakTheHiddenCodeAddress, betIndex, betIndex2 };
    }

    async function deployBetCreatedFixture() {
        const [account1, account2, account3, account4, breakTheHiddenCodeAddress] = await hre.ethers.getSigners();

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        const betIndex = 0;
        const betIndex2 = 1;

        const oneEth = hre.ethers.parseEther("1");
        const halfEth = hre.ethers.parseEther("0.5");

        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account1, account2, betIndex);
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account3, account4, betIndex2);

        return { pokerBettingProtocol, nullAddress, account1, account2, account3, account4, betIndex, betIndex2, breakTheHiddenCodeAddress, oneEth, halfEth };
    }

    async function deployFirstBetFixture() {
        const [account1, account2, account3, account4, breakTheHiddenCodeAddress] = await hre.ethers.getSigners();

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        const betIndex = 0;
        const betIndex2 = 1;

        const oneEth = hre.ethers.parseEther("1");
        const halfEth = hre.ethers.parseEther("0.5");
        const twoEth = hre.ethers.parseEther("2");

        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account1, account2, betIndex);
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account1, { "value": oneEth });

        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account3, account4, betIndex2);
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex2, account3, { "value": oneEth });

        const afkDeadline = (await time.latest()) + 31;

        return { pokerBettingProtocol, nullAddress, account1, account2, account3, account4, betIndex, betIndex2, breakTheHiddenCodeAddress, oneEth, halfEth, twoEth, afkDeadline };
    }

    async function deployCoupleBetsFixture() {
        const [account1, account2, account3, breakTheHiddenCodeAddress] = await hre.ethers.getSigners();

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        const betIndex = 0;

        const oneEth = hre.ethers.parseEther("1");
        const halfEth = hre.ethers.parseEther("0.5");
        const twoEth = hre.ethers.parseEther("2");

        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account1, account2, betIndex);
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account1, { "value": oneEth });
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account2, { "value": twoEth });

        const afkDeadline = (await time.latest()) + 31;

        return { pokerBettingProtocol, nullAddress, account1, account2, account3, betIndex, breakTheHiddenCodeAddress, oneEth, halfEth, twoEth, afkDeadline };
    }

    async function deployFoldedBetFixture() {
        const [account1, account2, account3, breakTheHiddenCodeAddress] = await hre.ethers.getSigners();

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        const betIndex = 0;

        const oneEth = hre.ethers.parseEther("1");
        const halfEth = hre.ethers.parseEther("0.5");
        const twoEth = hre.ethers.parseEther("2");

        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account1, account2, betIndex);
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account1, { "value": oneEth });
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).fold(betIndex, account2);

        return { pokerBettingProtocol, nullAddress, account1, account2, account3, betIndex, breakTheHiddenCodeAddress, oneEth, halfEth, twoEth };
    }

    async function deployAgreedBetFixture() {
        const [account1, account2, account3, breakTheHiddenCodeAddress] = await hre.ethers.getSigners();

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        const betIndex = 0;

        const oneEth = hre.ethers.parseEther("1");
        const halfEth = hre.ethers.parseEther("0.5");
        const twoEth = hre.ethers.parseEther("2");

        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account1, account2, betIndex);
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account1, { "value": oneEth });
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account2, { "value": oneEth });

        return { pokerBettingProtocol, nullAddress, account1, account2, account3, betIndex, breakTheHiddenCodeAddress, oneEth, halfEth, twoEth };
    }

    async function deployWithdrawedBetFixture() {
        const [account1, account2, account3, breakTheHiddenCodeAddress] = await hre.ethers.getSigners();

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        const betIndex = 0;

        const oneEth = hre.ethers.parseEther("1");
        const halfEth = hre.ethers.parseEther("0.5");
        const twoEth = hre.ethers.parseEther("2");

        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account1, account2, betIndex);
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account1, { "value": oneEth });
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account2, { "value": oneEth });
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account2);

        return { pokerBettingProtocol, nullAddress, account1, account2, account3, betIndex, breakTheHiddenCodeAddress, oneEth, halfEth, twoEth };
    }

    describe("New betting", function () {
        it("Should create a new bet", async function () {
            const { pokerBettingProtocol, account1, account2, breakTheHiddenCodeAddress, betIndex } = await loadFixture(deployPokerBettingProtocolFixture);

            await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account1, account2, betIndex))
                .to.emit(pokerBettingProtocol, "NewBet")
                .withArgs(betIndex);

            expect(await pokerBettingProtocol.players(betIndex, "0")).to.equal(account1.address);
            expect(await pokerBettingProtocol.players(betIndex, "1")).to.equal(account2.address);
            expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(account1.address);
        });

        it("Should fail because the function is not called by the BreakTheHiddenCode contract", async function () {
            const { pokerBettingProtocol, account1, account2, betIndex } = await loadFixture(deployPokerBettingProtocolFixture);

            await expect(pokerBettingProtocol.newBetting(account1, account2, betIndex))
                .to.be.revertedWith(
                    "This function can only be invoked by BreakTheHiddenCode contract"
                );
        });

        it("Should fail because it was passed a null address", async function () {
            const { pokerBettingProtocol, account1, nullAddress, breakTheHiddenCodeAddress, betIndex } = await loadFixture(deployPokerBettingProtocolFixture);

            await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account1, nullAddress, betIndex))
                .to.be.revertedWith(
                    "Invalid address"
                );
        });

        it("Should fail because the index is already in use", async function () {
            const { pokerBettingProtocol, account3, account4, breakTheHiddenCodeAddress, betIndex } = await loadFixture(deployBetCreatedFixture);

            await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account3, account4, betIndex))
                .to.be.revertedWith(
                    "Index already in use"
                );
        });

        it("Should fail because the address is trying to create a new bet with itself", async function () {
            const { pokerBettingProtocol, account1, breakTheHiddenCodeAddress, betIndex } = await loadFixture(deployPokerBettingProtocolFixture);

            await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account1, account1, betIndex))
                .to.be.revertedWith(
                    "Can't open a new bet with yourself"
                );
        });

        it("Should support more bet inizialization simultaneously", async function () {
            const { pokerBettingProtocol, account1, account2, account3, account4, breakTheHiddenCodeAddress, betIndex, betIndex2 } = await loadFixture(deployPokerBettingProtocolFixture);

            await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account1, account2, betIndex))
                .to.emit(pokerBettingProtocol, "NewBet")
                .withArgs(betIndex);

            await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account3, account4, betIndex2))
                .to.emit(pokerBettingProtocol, "NewBet")
                .withArgs(betIndex2);

            expect(await pokerBettingProtocol.players(betIndex, "0")).to.equal(account1.address);
            expect(await pokerBettingProtocol.players(betIndex, "1")).to.equal(account2.address);
            expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(account1.address);
            expect(await pokerBettingProtocol.players(betIndex2, "0")).to.equal(account3.address);
            expect(await pokerBettingProtocol.players(betIndex2, "1")).to.equal(account4.address);
            expect(await pokerBettingProtocol.nextMove(betIndex2)).to.equal(account3.address);
        });
    });

    describe("Betting phase", function () {
        describe("Bet", function () {
            it("Should do the first bet and emit a Rise event", async function () {
                const { pokerBettingProtocol, account1, account2, breakTheHiddenCodeAddress, betIndex, oneEth } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account1, { "value": oneEth }))
                    .to.emit(pokerBettingProtocol, "Rise")
                    .withArgs(betIndex, oneEth);

                expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(account2);
                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(oneEth);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(0);
            });

            it("Should fail because the function is not called by the BreakTheHiddenCode contract", async function () {
                const { pokerBettingProtocol, account1, betIndex, oneEth } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.bet(betIndex, account1, { "value": oneEth }))
                    .to.be.revertedWith(
                        "This function can only be invoked by BreakTheHiddenCode contract"
                    );
            });

            it("Should fail because the index doesn't exist", async function () {
                const { pokerBettingProtocol, account1, breakTheHiddenCodeAddress, oneEth } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(5, account1, { "value": oneEth }))
                    .to.be.revertedWith(
                        "Index doesn't exists"
                    );
            });

            it("Should fail because the address provided to the function is null", async function () {
                const { pokerBettingProtocol, nullAddress, betIndex, breakTheHiddenCodeAddress, oneEth } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, nullAddress, { "value": oneEth }))
                    .to.be.revertedWith(
                        "The provided address is null"
                    );
            });

            it("Should fail because it's not the turn of the calling address", async function () {
                const { pokerBettingProtocol, account2, betIndex, breakTheHiddenCodeAddress, oneEth } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account2, { "value": oneEth }))
                    .to.be.revertedWith(
                        "Invalid sender address. Not your turn"
                    );
            });

            it("Should fail because it didn't send any Wei", async function () {
                const { pokerBettingProtocol, account1, breakTheHiddenCodeAddress, betIndex } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account1))
                    .to.be.revertedWith(
                        "Invalid bet amount"
                    );

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account1, { "value": 0 }))
                    .to.be.revertedWith(
                        "Invalid bet amount"
                    );
            });

            it("Should emit Check when the second player matches the bet", async function () {
                const { pokerBettingProtocol, betIndex, oneEth, account2, nullAddress, breakTheHiddenCodeAddress } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account2, { "value": oneEth }))
                    .to.emit(pokerBettingProtocol, "Check")
                    .withArgs(betIndex);

                expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(nullAddress);
                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(oneEth);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(oneEth);
            });

            it("Should fail when the second player sends not enough Wei to match the current bet", async function () {
                const { pokerBettingProtocol, betIndex, halfEth, breakTheHiddenCodeAddress, account2 } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account2, { "value": halfEth }))
                    .to.be.revertedWith(
                        "Sendend amount is not valid"
                    );
            });

            it("Should emit a Rise after the second player rises again the bet and the difference is half Eth, then emit a Check when the first player matches the bet", async function () {
                const { pokerBettingProtocol, account1, account2, breakTheHiddenCodeAddress, nullAddress, betIndex, twoEth, oneEth } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account2, { "value": twoEth }))
                    .to.emit(pokerBettingProtocol, "Rise")
                    .withArgs(betIndex, oneEth);

                expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(account1);
                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(oneEth);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(twoEth);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account1, { "value": oneEth }))
                    .to.emit(pokerBettingProtocol, "Check")
                    .withArgs(betIndex);

                expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(nullAddress);
                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(twoEth);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(twoEth);
            });

            it("Should support more bet simultaneously", async function () {
                const { pokerBettingProtocol, account1, account2, account3, account4, breakTheHiddenCodeAddress, betIndex, betIndex2, oneEth, halfEth } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account1, { "value": halfEth }))
                    .to.emit(pokerBettingProtocol, "Rise")
                    .withArgs(betIndex, halfEth);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex2, account3, { "value": halfEth }))
                    .to.emit(pokerBettingProtocol, "Rise")
                    .withArgs(betIndex2, halfEth);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account2, { "value": halfEth }))
                    .to.emit(pokerBettingProtocol, "Check")
                    .withArgs(betIndex);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex2, account4, { "value": oneEth }))
                    .to.emit(pokerBettingProtocol, "Rise")
                    .withArgs(betIndex2, halfEth);
            });
        });

        describe("Fold", function () {
            it("Should fail because the function is not called by the BreakTheHiddenCode contract", async function () {
                const { pokerBettingProtocol, account2, betIndex } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.fold(betIndex, account2))
                    .to.be.revertedWith(
                        "This function can only be invoked by BreakTheHiddenCode contract"
                    );
            });

            it("Should fail because the index doesn't exist", async function () {
                const { pokerBettingProtocol, account2, breakTheHiddenCodeAddress } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).fold(5, account2))
                    .to.be.revertedWith(
                        "Index doesn't exists"
                    );
            });

            it("Should fail because the provided address is null", async function () {
                const { pokerBettingProtocol, betIndex, nullAddress, breakTheHiddenCodeAddress } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).fold(betIndex, nullAddress))
                    .to.be.revertedWith(
                        "The provided address is null"
                    );
            });

            it("Should fail because it's not the turn of the calling address", async function () {
                const { pokerBettingProtocol, betIndex, account1, breakTheHiddenCodeAddress } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).fold(betIndex, account1))
                    .to.be.revertedWith(
                        "Invalid sender address. Not your turn"
                    );
            });

            it("Should fold the betting and emit Fold", async function () {
                const { pokerBettingProtocol, betIndex, nullAddress, breakTheHiddenCodeAddress, account2 } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).fold(betIndex, account2))
                    .to.emit(pokerBettingProtocol, "Fold")
                    .withArgs(betIndex);

                expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(nullAddress);
                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(0);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(0);
                expect(await pokerBettingProtocol.players(betIndex, "0")).to.equal(nullAddress);
                expect(await pokerBettingProtocol.players(betIndex, "1")).to.equal(nullAddress);
            });

            it("Should fail when trying to fold after the other player already folded", async function () {
                const { pokerBettingProtocol, betIndex, breakTheHiddenCodeAddress, account2 } = await loadFixture(deployFoldedBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).fold(betIndex, account2))
                    .to.be.revertedWith(
                        "Index doesn't exists"
                    );
            });

            it("Should fail when a player try to bet after the other player folded", async function () {
                const { pokerBettingProtocol, betIndex, oneEth, breakTheHiddenCodeAddress, account2 } = await loadFixture(deployFoldedBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account2, { "value": oneEth }))
                    .to.be.revertedWith(
                        "Index doesn't exists"
                    );
            });

            it("Should emit Fold when trying to fold a bet that hasn't started yet", async function () {
                const { pokerBettingProtocol, betIndex, account1, breakTheHiddenCodeAddress } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).fold(betIndex, account1))
                    .to.emit(pokerBettingProtocol, "Fold")
                    .withArgs(betIndex);
            });

            it("Should fold the betting and emit Fold simlutaneously", async function () {
                const { pokerBettingProtocol, account2, account4, betIndex, betIndex2, nullAddress, breakTheHiddenCodeAddress } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).fold(betIndex, account2))
                    .to.emit(pokerBettingProtocol, "Fold")
                    .withArgs(betIndex);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).fold(betIndex2, account4))
                    .to.emit(pokerBettingProtocol, "Fold")
                    .withArgs(betIndex2);

                expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(nullAddress);
                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(0);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(0);
                expect(await pokerBettingProtocol.players(betIndex, "0")).to.equal(nullAddress);
                expect(await pokerBettingProtocol.players(betIndex, "1")).to.equal(nullAddress);

                expect(await pokerBettingProtocol.nextMove(betIndex2)).to.equal(nullAddress);
                expect(await pokerBettingProtocol.bets(betIndex2, "0")).to.equal(0);
                expect(await pokerBettingProtocol.bets(betIndex2, "1")).to.equal(0);
                expect(await pokerBettingProtocol.players(betIndex2, "0")).to.equal(nullAddress);
                expect(await pokerBettingProtocol.players(betIndex2, "1")).to.equal(nullAddress);
            });
        });
    });

    describe("Withdraw phase", function () {
        describe("Withdraw with a winner", function() {
            it("Should give the entire bet to the winner", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2, twoEth, betIndex, nullAddress } = await loadFixture(deployAgreedBetFixture);

                const response = await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account2);

                await expect(response)
                    .to.emit(pokerBettingProtocol, "Withdraw")
                    .withArgs(betIndex, account2, twoEth);

                await expect(response).to.changeEtherBalances(
                    [pokerBettingProtocol, account2],
                    [-twoEth, twoEth]
                    );

                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(0);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(0);
                expect(await pokerBettingProtocol.players(betIndex, "0")).to.equal(nullAddress);
                expect(await pokerBettingProtocol.players(betIndex, "1")).to.equal(nullAddress);
            });

            it("Should give only the first bet to the winner", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2, betIndex, nullAddress, oneEth } = await loadFixture(deployFirstBetFixture);

                const response = await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account2);

                await expect(response)
                    .to.emit(pokerBettingProtocol, "Withdraw")
                    .withArgs(betIndex, account2, oneEth);

                await expect(response).to.changeEtherBalances(
                    [pokerBettingProtocol, account2],
                    [-oneEth, oneEth]
                );

                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(0);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(0);
                expect(await pokerBettingProtocol.players(betIndex, "0")).to.equal(nullAddress);
                expect(await pokerBettingProtocol.players(betIndex, "1")).to.equal(nullAddress);
            });

            it("Should fail if an address that is not the breakTheHiddenCodeAddress try to call the withdraw method", async function () {
                const { pokerBettingProtocol, account1, account2, betIndex } = await loadFixture(deployAgreedBetFixture);

                await expect(pokerBettingProtocol.connect(account1).withdraw(betIndex, account2))
                    .to.be.revertedWith(
                        "This function can only be invoked by BreakTheHiddenCode contract"
                    );
            });

            it("Should fail if the index doesn't exist", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2 } = await loadFixture(deployAgreedBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(5, account2))
                    .to.be.revertedWith(
                        "Index doesn't exist"
                    );
            });

            it("Should fail if the winner address provided is not correct", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, account3, betIndex } = await loadFixture(deployAgreedBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account3))
                    .to.be.revertedWith(
                        "Winner address doesn't exist"
                    );
            });

            it("Should fail if the BreakTheHiddenCode contract try to withdraw the same winner more than once", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2, betIndex } = await loadFixture(deployWithdrawedBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account2))
                    .to.be.revertedWith(
                        "Index doesn't exist"
                    )
            });

            it("Should fail if the BreakTheHiddenCode contract try to withdraw a created but non-started bet", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2, betIndex } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account2))
                    .to.be.revertedWith(
                        "Bet not started yet"
                    )
            });

            it("Should fail if the BreakTheHiddenCode contract try to withdraw a folded bet", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2, betIndex } = await loadFixture(deployFoldedBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account2))
                    .to.be.revertedWith(
                        "Index doesn't exist"
                    )
            });
        });

        describe("Withdraw with a tie", function () {
            it("Should give the bets to their owners", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, account1, account2, oneEth, twoEth, betIndex, nullAddress } = await loadFixture(deployAgreedBetFixture);

                const response = await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdrawTie(betIndex);

                await expect(response)
                    .to.emit(pokerBettingProtocol, "WithdrawTie")
                    .withArgs(betIndex, account1, account2);

                await expect(response).to.changeEtherBalances(
                    [pokerBettingProtocol, account1, account2],
                    [-twoEth, oneEth, oneEth]
                    );

                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(0);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(0);
                expect(await pokerBettingProtocol.players(betIndex, "0")).to.equal(nullAddress);
                expect(await pokerBettingProtocol.players(betIndex, "1")).to.equal(nullAddress);
            });

            it("Should fail if an address that is not the breakTheHiddenCodeAddress try to call the withdraw method", async function () {
                const { pokerBettingProtocol, account1, betIndex } = await loadFixture(deployAgreedBetFixture);

                await expect(pokerBettingProtocol.connect(account1).withdrawTie(betIndex))
                    .to.be.revertedWith(
                        "This function can only be invoked by BreakTheHiddenCode contract"
                    );
            });

            it("Should fail if the index doesn't exist", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress } = await loadFixture(deployAgreedBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdrawTie(5))
                    .to.be.revertedWith(
                        "Index doesn't exist"
                    );
            });

            it("Should fail if the BreakTheHiddenCode contract try to withdraw the same winner more than once", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, betIndex } = await loadFixture(deployWithdrawedBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdrawTie(betIndex))
                    .to.be.revertedWith(
                        "Index doesn't exist"
                    )
            });

            it("Should fail if the BreakTheHiddenCode contract try to withdraw a created but non-started bet", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, betIndex } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdrawTie(betIndex))
                    .to.be.revertedWith(
                        "Bet not started yet"
                    )
            });

            it("Should fail if the BreakTheHiddenCode contract try to withdraw a non-agreed bet", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, betIndex } = await loadFixture(deployCoupleBetsFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdrawTie(betIndex))
                    .to.be.revertedWith(
                        "The bet is not agreed yet"
                    )
            });

            it("Should fail if the BreakTheHiddenCode contract try to withdraw a folded bet", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, betIndex } = await loadFixture(deployFoldedBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdrawTie(betIndex))
                    .to.be.revertedWith(
                        "Index doesn't exist"
                    )
            });
        });
    });

    describe("Utils", function () {
        describe("Can game start", function () {
            it("Should return true when the betting is done", async function () {
                const { pokerBettingProtocol, betIndex } = await loadFixture(deployAgreedBetFixture);
                
                expect(await pokerBettingProtocol.isBetFinished(betIndex)).to.equal(true);
            });

            it("Should return false when the betting is not done", async function () {
                const { pokerBettingProtocol, betIndex } = await loadFixture(deployCoupleBetsFixture);

                expect(await pokerBettingProtocol.isBetFinished(betIndex)).to.equal(false);
            });

            it("Should fail because the index doesn't exists", async function () {
                const { pokerBettingProtocol } = await loadFixture(deployAgreedBetFixture);

                await expect(pokerBettingProtocol.isBetFinished(5))
                .to.be.revertedWith(
                    "Index doesn't exists"
                );
            });

            it("Should fail because the bet didn't start yet", async function () {
                const { pokerBettingProtocol, betIndex } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.isBetFinished(betIndex))
                .to.be.revertedWith(
                    "Bet not started yet"
                );
            });
        });

        describe("Is bet created", function () {
            it("Should return true because the bet is created", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, betIndex } = await loadFixture(deployBetCreatedFixture);

                expect(await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).isBetCreated(betIndex)).to.equal(true);
            });

            it("Should return false because the bet is not created", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, betIndex } = await loadFixture(deployPokerBettingProtocolFixture);

                expect(await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).isBetCreated(betIndex)).to.equal(false);
            });
        });
    });
});
