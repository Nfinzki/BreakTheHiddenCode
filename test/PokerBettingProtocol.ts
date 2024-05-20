import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { extendEnvironment } from "hardhat/config";

describe("PokerBettingProtocol", function () {
    async function deployPokerBettingProtocolFixture() {
        const [account1, account2, account3, account4, breakTheHiddenCodeAddress] = await hre.ethers.getSigners();
        const afkTime = 31;

        const betIndex = 0;
        const betIndex2 = 1;

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress, afkTime);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        return { pokerBettingProtocol, nullAddress, account1, account2, account3, account4, breakTheHiddenCodeAddress, betIndex, betIndex2 };
    }

    async function deployBetCreatedFixture() {
        const [account1, account2, account3, account4, breakTheHiddenCodeAddress] = await hre.ethers.getSigners();
        const afkTime = 31;

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress, afkTime);

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
        const afkTime = 31;

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress, afkTime);

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
        const afkTime = 31;

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress, afkTime);

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
        const afkTime = 31;

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress, afkTime);

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
        const afkTime = 31;

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress, afkTime);

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

    async function deployAfkIssuedFixture() {
        const [account1, account2, account3, breakTheHiddenCodeAddress] = await hre.ethers.getSigners();
        const afkTime = 31;

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress, afkTime);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        const betIndex = 0;

        const oneEth = hre.ethers.parseEther("1");
        const halfEth = hre.ethers.parseEther("0.5");
        const twoEth = hre.ethers.parseEther("2");

        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).newBetting(account1, account2, betIndex);
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account1, { "value": oneEth });
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account2, { "value": twoEth });

        const afkDeadline = (await time.latest()) + 31;
        await time.increaseTo(afkDeadline);

        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).issueAfk(betIndex, account2);

        return { pokerBettingProtocol, nullAddress, account1, account2, account3, betIndex, breakTheHiddenCodeAddress, oneEth, halfEth, twoEth, afkDeadline };
    }

    async function deployWithdrawedBetFixture() {
        const [account1, account2, account3, breakTheHiddenCodeAddress] = await hre.ethers.getSigners();
        const afkTime = 31;

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress, afkTime);

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

    describe("Betting phase", async function () {
        describe("Bet", async function () {
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

        describe("Fold", async function () {
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

        describe("Issue AFK", async function () {
            it("Should get its money back if the opponent doesn't respond after the first bet", async function () {
                const { pokerBettingProtocol, oneEth, afkDeadline, betIndex, account1, nullAddress, breakTheHiddenCodeAddress } = await loadFixture(deployFirstBetFixture);

                await time.increaseTo(afkDeadline);

                const response = pokerBettingProtocol.connect(breakTheHiddenCodeAddress).issueAfk(betIndex, account1);
                await expect(response)
                    .to.emit(pokerBettingProtocol, "Afk")
                    .withArgs(betIndex);

                await expect(response).to.changeEtherBalances(
                    [pokerBettingProtocol, account1],
                    [-oneEth, oneEth]
                  );

                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(0);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(0);
                expect(await pokerBettingProtocol.players(betIndex, "0")).to.equal(nullAddress);
                expect(await pokerBettingProtocol.players(betIndex, "1")).to.equal(nullAddress);
                expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(nullAddress);
            });

            it("Should get its money back if the opponent takes too much time in any moment", async function () {
                const { pokerBettingProtocol, oneEth, twoEth, afkDeadline, betIndex, account2, nullAddress, breakTheHiddenCodeAddress } = await loadFixture(deployCoupleBetsFixture);

                await time.increaseTo(afkDeadline);

                const response = pokerBettingProtocol.connect(breakTheHiddenCodeAddress).issueAfk(betIndex, account2);

                await expect(response)
                    .to.emit(pokerBettingProtocol, "Afk")
                    .withArgs(betIndex);

                await expect(response).to.changeEtherBalances(
                    [pokerBettingProtocol, account2],
                    [-(oneEth + twoEth), oneEth + twoEth]
                    );

                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(0);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(0);
                expect(await pokerBettingProtocol.players(betIndex, "0")).to.equal(nullAddress);
                expect(await pokerBettingProtocol.players(betIndex, "1")).to.equal(nullAddress);
                expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(nullAddress);
            });

            it("Should fail because the function is not called by the BreakTheHiddenCode contract", async function () {
                const { pokerBettingProtocol, betIndex, account2 } = await loadFixture(deployCoupleBetsFixture);

                await expect(pokerBettingProtocol.issueAfk(betIndex, account2))
                    .to.be.revertedWith(
                        "This function can only be invoked by BreakTheHiddenCode contract"
                    );
            });

            it("Should fail because index doesn't exist", async function () {
                const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2 } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).issueAfk(5, account2))
                    .to.be.revertedWith(
                        "Index doesn't exists"
                    );
            });

            it("Should fail because the user is trying to issue the AFK while it's his turn", async function () {
                const { pokerBettingProtocol, betIndex, breakTheHiddenCodeAddress, account2 } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).issueAfk(betIndex, account2))
                    .to.be.revertedWith(
                        "Invalid sender address. You can't issue the AFK status if it's your turn"
                    );
            });

            it("Should fail because the user is trying to issue the AFK while the bet is only created but not started", async function () {
                const { pokerBettingProtocol, betIndex, breakTheHiddenCodeAddress, account2 } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).issueAfk(betIndex, account2))
                    .to.be.revertedWith(
                        "Bet not started yet"
                    );
            });

            it("Should fail because the user is trying to issue the AFK while the AFK tolerance didn't elapse yet", async function () {
                const { pokerBettingProtocol, account1, betIndex, breakTheHiddenCodeAddress } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).issueAfk(betIndex, account1))
                    .to.be.revertedWith(
                        "The opponent still has time to make a choice"
                    );
            });

            it("Should fail when trying to bet on a betting terminated by an AFK issuing", async function () {
                const { pokerBettingProtocol, account1, betIndex, oneEth, breakTheHiddenCodeAddress } = await loadFixture(deployAfkIssuedFixture);

                await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).bet(betIndex, account1, { value: oneEth }))
                    .to.be.revertedWith(
                        "Index doesn't exists"
                    );
            });
        });
    });

    describe("Withdraw phase", async function () {
        it("Should give the entire bet to the winner", async function () {
            const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2, twoEth, betIndex, nullAddress } = await loadFixture(deployAgreedBetFixture);

            const initialBalance = await hre.ethers.provider.getBalance(await account2.getAddress());

            await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account2);

            const finalBalance = await hre.ethers.provider.getBalance(await account2.getAddress());

            expect(finalBalance - initialBalance).to.equal(twoEth);

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

        it("Should fail if the BreakTheHiddenCode contract try to withdraw a non-agreed bet", async function () {
            const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2, betIndex } = await loadFixture(deployCoupleBetsFixture);

            await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account2))
                .to.be.revertedWith(
                    "The bet is not already agreed"
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
});
