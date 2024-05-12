import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { extendEnvironment } from "hardhat/config";

describe("PokerBettingProtocol", function () {
    async function deployPokerBettingProtocolFixture() {
        const [account1, account2, account3, account4, breakTheHiddenCodeAddress] = await hre.ethers.getSigners();

        const PokerBettingProtocol = await hre.ethers.getContractFactory("PokerBettingProtocol");
        const pokerBettingProtocol = await PokerBettingProtocol.deploy(breakTheHiddenCodeAddress);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        return { pokerBettingProtocol, nullAddress, account1, account2, account3, account4, breakTheHiddenCodeAddress };
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

        await pokerBettingProtocol.newBetting(account2, betIndex);
        await pokerBettingProtocol.connect(account3).newBetting(account4, betIndex2);

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

        await pokerBettingProtocol.newBetting(account2, betIndex);
        await pokerBettingProtocol.connect(account2).bet(betIndex, {"value": oneEth});
        
        await pokerBettingProtocol.connect(account3).newBetting(account4, betIndex2);
        await pokerBettingProtocol.connect(account4).bet(betIndex2, {"value": oneEth});

        return { pokerBettingProtocol, nullAddress, account1, account2, account3, account4, betIndex, betIndex2, breakTheHiddenCodeAddress, oneEth, halfEth, twoEth }; 
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

        await pokerBettingProtocol.newBetting(account2, betIndex);
        await pokerBettingProtocol.connect(account2).bet(betIndex, {"value": oneEth});
        await pokerBettingProtocol.bet(betIndex, {"value": twoEth});

        return { pokerBettingProtocol, nullAddress, account1, account2, account3, betIndex, breakTheHiddenCodeAddress, oneEth, halfEth, twoEth }; 
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

        await pokerBettingProtocol.newBetting(account2, betIndex);
        await pokerBettingProtocol.connect(account2).bet(betIndex, {"value": oneEth});
        await pokerBettingProtocol.fold(betIndex);

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

        await pokerBettingProtocol.newBetting(account2, betIndex);
        await pokerBettingProtocol.connect(account2).bet(betIndex, {"value": oneEth});
        await pokerBettingProtocol.bet(betIndex, {"value": oneEth});

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

        await pokerBettingProtocol.newBetting(account2, betIndex);
        await pokerBettingProtocol.connect(account2).bet(betIndex, {"value": oneEth});
        await pokerBettingProtocol.bet(betIndex, {"value": oneEth});
        await pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account2);

        return { pokerBettingProtocol, nullAddress, account1, account2, account3, betIndex, breakTheHiddenCodeAddress, oneEth, halfEth, twoEth }; 
    }

    describe("New betting", function () {
        it("Should create a new bet", async function() {
            const { pokerBettingProtocol, account1, account2 } = await loadFixture(deployPokerBettingProtocolFixture);

            await expect(pokerBettingProtocol.newBetting(account2, 0))
                .to.emit(pokerBettingProtocol, "NewBet")
                .withArgs(0);

            expect(await pokerBettingProtocol.players("0", "0")).to.equal(account2.address);
            expect(await pokerBettingProtocol.players("0", "1")).to.equal(account1.address);
            expect(await pokerBettingProtocol.nextMove("0")).to.equal(account2.address);
        });

        it("Should fail because it was passed a null address", async function() {
            const { pokerBettingProtocol, nullAddress } = await loadFixture(deployPokerBettingProtocolFixture);

            await expect(pokerBettingProtocol.newBetting(nullAddress, 0))
                .to.be.revertedWith(
                    "Invalid address"
                );
        });

        it("Should fail because the index is already in use", async function() {
            const { pokerBettingProtocol, account3, betIndex } = await loadFixture(deployBetCreatedFixture);

            await expect(pokerBettingProtocol.newBetting(account3, betIndex))
                .to.be.revertedWith(
                    "Index already in use"
                );
        });

        it("Should fail because the address is trying to create a new bet with itself", async function() {
            const { pokerBettingProtocol, account1 } = await loadFixture(deployPokerBettingProtocolFixture);

            await expect(pokerBettingProtocol.newBetting(account1, 0))
                .to.be.revertedWith(
                    "Can't open a new bet with yourself"
                );
        });

        it("Should support more bet inizialization simultaneously", async function() {
            const { pokerBettingProtocol, account1, account2, account3, account4 } = await loadFixture(deployPokerBettingProtocolFixture);

            await expect(pokerBettingProtocol.newBetting(account2, 0))
                .to.emit(pokerBettingProtocol, "NewBet")
                .withArgs(0);

            await expect(pokerBettingProtocol.connect(account3).newBetting(account4, 1))
            .to.emit(pokerBettingProtocol, "NewBet")
            .withArgs(1);

            expect(await pokerBettingProtocol.players("0", "0")).to.equal(account2.address);
            expect(await pokerBettingProtocol.players("0", "1")).to.equal(account1.address);
            expect(await pokerBettingProtocol.nextMove("0")).to.equal(account2.address);
            expect(await pokerBettingProtocol.players("1", "0")).to.equal(account4.address);
            expect(await pokerBettingProtocol.players("1", "1")).to.equal(account3.address);
            expect(await pokerBettingProtocol.nextMove("1")).to.equal(account4.address);
        });
    });

    describe("Betting phase", async function() {
        describe("Bet", async function() {
            it("Should do the first bet and emit a Rise event", async function() {
                const { pokerBettingProtocol, account1, account2, betIndex, oneEth } = await loadFixture(deployBetCreatedFixture);
    
                await expect(pokerBettingProtocol.connect(account2).bet(betIndex, {"value": oneEth}))
                    .to.emit(pokerBettingProtocol, "Rise")
                    .withArgs(betIndex, oneEth);

                expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(account1);
                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(oneEth);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(0);
            });
    
            it("Should fail because the index doesn't exist", async function() {
                const { pokerBettingProtocol, account2, oneEth } = await loadFixture(deployBetCreatedFixture);
    
                await expect(pokerBettingProtocol.connect(account2).bet(5, {"value": oneEth}))
                    .to.be.revertedWith(
                        "Index doesn't exists"
                    );
            });
    
            it("Should fail because it's not the turn of the calling address", async function() {
                const { pokerBettingProtocol, betIndex, oneEth } = await loadFixture(deployBetCreatedFixture);
    
                await expect(pokerBettingProtocol.bet(betIndex, {"value": oneEth}))
                    .to.be.revertedWith(
                        "Invalid sender address. Not your turn"
                    );
            });
    
            it("Should fail because it didn't send any Wei", async function() {
                const { pokerBettingProtocol, account2, betIndex } = await loadFixture(deployBetCreatedFixture);
    
                await expect(pokerBettingProtocol.connect(account2).bet(betIndex))
                    .to.be.revertedWith(
                        "Invalid bet amount"
                    );
    
                await expect(pokerBettingProtocol.connect(account2).bet(betIndex, {"value": 0}))
                .to.be.revertedWith(
                    "Invalid bet amount"
                );
            });

            it("Should emit Check when the second player matches the bet", async function() {
                const { pokerBettingProtocol, betIndex, oneEth, nullAddress } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.bet(betIndex, {"value": oneEth}))
                    .to.emit(pokerBettingProtocol, "Check")
                    .withArgs(betIndex);

                expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(nullAddress);
                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(oneEth);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(oneEth);
            });

            it("Should fail when the second player sends not enough Wei to match the current bet", async function() {
                const { pokerBettingProtocol, betIndex, halfEth } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.bet(betIndex, {"value": halfEth}))
                    .to.be.revertedWith(
                        "Sendend amount is not valid"
                    );
            });

            it("Should emit a Rise after the second player rises again the bet and the difference is half Eth, then emit a Check when the first player matches the bet", async function() {
                const { pokerBettingProtocol, account2, nullAddress, betIndex, twoEth, oneEth } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.bet(betIndex, {"value": twoEth}))
                    .to.emit(pokerBettingProtocol, "Rise")
                    .withArgs(betIndex, oneEth);

                expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(account2);
                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(oneEth);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(twoEth);

                await expect(pokerBettingProtocol.connect(account2).bet(betIndex, {"value": oneEth}))
                    .to.emit(pokerBettingProtocol, "Check")
                    .withArgs(betIndex);

                expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(nullAddress);
                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(twoEth);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(twoEth);
            });

            it("Should support more bet simultaneously", async function() {
                const { pokerBettingProtocol, account1, account2, account3, account4, betIndex, betIndex2, oneEth, halfEth } = await loadFixture(deployBetCreatedFixture);

                await expect(pokerBettingProtocol.connect(account2).bet(betIndex, {"value": halfEth}))
                    .to.emit(pokerBettingProtocol, "Rise")
                    .withArgs(betIndex, halfEth);
                
                await expect(pokerBettingProtocol.connect(account4).bet(betIndex2, {"value": halfEth}))
                .to.emit(pokerBettingProtocol, "Rise")
                .withArgs(betIndex2, halfEth);

                await expect(pokerBettingProtocol.connect(account1).bet(betIndex, {"value": halfEth}))
                    .to.emit(pokerBettingProtocol, "Check")
                    .withArgs(betIndex);
                
                await expect(pokerBettingProtocol.connect(account3).bet(betIndex2, {"value": oneEth}))
                .to.emit(pokerBettingProtocol, "Rise")
                .withArgs(betIndex2, halfEth);
            });
        });
        
        describe("Fold", async function() {
            it("Should fail because the index doesn't exist", async function() {
                const { pokerBettingProtocol } = await loadFixture(deployFirstBetFixture);
    
                await expect(pokerBettingProtocol.fold(5))
                    .to.be.revertedWith(
                        "Index doesn't exists"
                    );
            });
    
            it("Should fail because it's not the turn of the calling address", async function() {
                const { pokerBettingProtocol, betIndex, account2 } = await loadFixture(deployFirstBetFixture);
    
                await expect(pokerBettingProtocol.connect(account2).fold(betIndex))
                    .to.be.revertedWith(
                        "Invalid sender address. Not your turn"
                    );
            });

            it("Should fold the betting and emit Fold", async function() {
                const { pokerBettingProtocol, betIndex, nullAddress } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.fold(betIndex))
                    .to.emit(pokerBettingProtocol, "Fold")
                    .withArgs(betIndex);

                expect(await pokerBettingProtocol.nextMove(betIndex)).to.equal(nullAddress);
                expect(await pokerBettingProtocol.bets(betIndex, "0")).to.equal(0);
                expect(await pokerBettingProtocol.bets(betIndex, "1")).to.equal(0);
                expect(await pokerBettingProtocol.players(betIndex, "0")).to.equal(nullAddress);
                expect(await pokerBettingProtocol.players(betIndex, "1")).to.equal(nullAddress);
            });

            it("Should fail when trying to fold after the other player already folded", async function() {
                const { pokerBettingProtocol, betIndex } = await loadFixture(deployFoldedBetFixture);

                await expect(pokerBettingProtocol.fold(betIndex))
                    .to.be.revertedWith(
                        "Index doesn't exists"
                    );
            });

            it("Should fail when a player try to bet after the other player folded", async function() {
               const { pokerBettingProtocol, betIndex, oneEth } = await loadFixture(deployFoldedBetFixture);
               
               await expect(pokerBettingProtocol.bet(betIndex, {"value": oneEth}))
                .to.be.revertedWith(
                    "Index doesn't exists"
                );
            });

            it("Should emit Fold when trying to fold a bet that hasn't started yet", async function() {
                const { pokerBettingProtocol, betIndex, account2 } = await loadFixture(deployBetCreatedFixture);
               
                await expect(pokerBettingProtocol.connect(account2).fold(betIndex))
                    .to.emit(pokerBettingProtocol, "Fold")
                    .withArgs(betIndex);
            });

            it("Should fold the betting and emit Fold simlutaneously", async function() {
                const { pokerBettingProtocol, account3, betIndex, betIndex2, nullAddress } = await loadFixture(deployFirstBetFixture);

                await expect(pokerBettingProtocol.fold(betIndex))
                    .to.emit(pokerBettingProtocol, "Fold")
                    .withArgs(betIndex);

                await expect(pokerBettingProtocol.connect(account3).fold(betIndex2))
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

    describe("Withdraw phase", async function() {
        it("Should give the entire bet to the winner", async function() {
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

        it("Should fail if an address that is not the breakTheHiddenCodeAddress try to call the withdraw method", async function() {
            const { pokerBettingProtocol, account1, account2, betIndex } = await loadFixture(deployAgreedBetFixture);

            await expect(pokerBettingProtocol.connect(account1).withdraw(betIndex, account2))
                .to.be.revertedWith(
                    "This function can only be invoked by BreakTheHiddenCode contract"
                );
        });

        it("Should fail if the index doesn't exist", async function() {
            const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2 } = await loadFixture(deployAgreedBetFixture);

            await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(5, account2))
                .to.be.revertedWith(
                    "Index doesn't exist"
                );
        });

        it("Should fail if the winner address provided is not correct", async function() {
            const { pokerBettingProtocol, breakTheHiddenCodeAddress, account3, betIndex } = await loadFixture(deployAgreedBetFixture);

            await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account3))
                .to.be.revertedWith(
                    "Winner address doesn't exist"
                );
        });

        it("Should fail if the BreakTheHiddenCode contract try to withdraw the same winner more than once", async function() {
            const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2, betIndex } = await loadFixture(deployWithdrawedBetFixture);

            await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account2))
                .to.be.revertedWith(
                    "Index doesn't exist"
                )
        });

        it("Should fail if the BreakTheHiddenCode contract try to withdraw a created but non-started bet", async function() {
            const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2, betIndex } = await loadFixture(deployBetCreatedFixture);

            await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account2))
                .to.be.revertedWith(
                    "Bet not started yet"
                )
        });

        it("Should fail if the BreakTheHiddenCode contract try to withdraw a non-agreed bet", async function() {
            const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2, betIndex } = await loadFixture(deployCoupleBetsFixture);

            await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account2))
                .to.be.revertedWith(
                    "The bet is not already agreed"
                )
        });

        it("Should fail if the BreakTheHiddenCode contract try to withdraw a folded bet", async function() {
            const { pokerBettingProtocol, breakTheHiddenCodeAddress, account2, betIndex } = await loadFixture(deployFoldedBetFixture);

            await expect(pokerBettingProtocol.connect(breakTheHiddenCodeAddress).withdraw(betIndex, account2))
                .to.be.revertedWith(
                    "Index doesn't exist"
                )
        });
    });
});
