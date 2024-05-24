import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
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

    async function deployBthcAndCreateAGameFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const BreakTheHiddenCode = await hre.ethers.getContractFactory("BreakTheHiddenCode");
        const breakTheHiddenCode = await BreakTheHiddenCode.deploy();

        const nullAddress = "0x0000000000000000000000000000000000000000";

        await breakTheHiddenCode["createGame()"]();

        return { breakTheHiddenCode, nullAddress, account1, account2, account3 };
    }

    async function deployBthcAndCreateMultipleGamesFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const BreakTheHiddenCode = await hre.ethers.getContractFactory("BreakTheHiddenCode");
        const breakTheHiddenCode = await BreakTheHiddenCode.deploy();

        const nullAddress = "0x0000000000000000000000000000000000000000";

        await breakTheHiddenCode.connect(account1)["createGame()"]();
        await breakTheHiddenCode.connect(account3)["createGame()"]();
        await breakTheHiddenCode.connect(account4)["createGame()"]();

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

    async function deployGameJoinedFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const BreakTheHiddenCode = await hre.ethers.getContractFactory("BreakTheHiddenCode");
        const breakTheHiddenCode = await BreakTheHiddenCode.deploy();

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const halfEth = hre.ethers.parseEther("0.5");
        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await breakTheHiddenCode["createGame()"]();
        await breakTheHiddenCode.connect(account2).joinGame();

        return { breakTheHiddenCode, gameId, nullAddress, account1, account2, account3, halfEth, oneEth, twoEth };
    }

    async function deployFirstBetFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const BreakTheHiddenCode = await hre.ethers.getContractFactory("BreakTheHiddenCode");
        const breakTheHiddenCode = await BreakTheHiddenCode.deploy();

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const halfEth = hre.ethers.parseEther("0.5");
        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await breakTheHiddenCode["createGame()"]();
        await breakTheHiddenCode.connect(account2).joinGame();
        await breakTheHiddenCode.connect(account1).bet(gameId, {"value": oneEth});

        return { breakTheHiddenCode, gameId, nullAddress, account1, account2, account3, halfEth, oneEth, twoEth };
    }

    async function deployCoupleBetsFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const BreakTheHiddenCode = await hre.ethers.getContractFactory("BreakTheHiddenCode");
        const breakTheHiddenCode = await BreakTheHiddenCode.deploy();

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const halfEth = hre.ethers.parseEther("0.5");
        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await breakTheHiddenCode["createGame()"]();
        await breakTheHiddenCode.connect(account2).joinGame();
        await breakTheHiddenCode.connect(account1).bet(gameId, {"value": oneEth});
        await breakTheHiddenCode.connect(account2).bet(gameId, {"value": twoEth});

        const afkDeadline = (await time.latest()) + 31;

        return { breakTheHiddenCode, gameId, nullAddress, account1, account2, account3, halfEth, oneEth, twoEth, afkDeadline };
    }

    async function deployFoldFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const BreakTheHiddenCode = await hre.ethers.getContractFactory("BreakTheHiddenCode");
        const breakTheHiddenCode = await BreakTheHiddenCode.deploy();

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const halfEth = hre.ethers.parseEther("0.5");
        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await breakTheHiddenCode["createGame()"]();
        await breakTheHiddenCode.connect(account2).joinGame();
        await breakTheHiddenCode.connect(account1).bet(gameId, {"value": oneEth});
        await breakTheHiddenCode.connect(account2).fold(gameId);

        return { breakTheHiddenCode, gameId, nullAddress, account1, account2, account3, halfEth, oneEth, twoEth };
    }

    async function deployAfkFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const BreakTheHiddenCode = await hre.ethers.getContractFactory("BreakTheHiddenCode");
        const breakTheHiddenCode = await BreakTheHiddenCode.deploy();

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const halfEth = hre.ethers.parseEther("0.5");
        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await breakTheHiddenCode["createGame()"]();
        await breakTheHiddenCode.connect(account2).joinGame();
        await breakTheHiddenCode.connect(account1).bet(gameId, {"value": oneEth});

        time.increaseTo((await time.latest()) + 31)

        await breakTheHiddenCode.connect(account1).issueAfk(gameId);

        return { breakTheHiddenCode, gameId, nullAddress, account1, account2, account3, halfEth, oneEth, twoEth };
    }

    async function deployAgreedBetFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const BreakTheHiddenCode = await hre.ethers.getContractFactory("BreakTheHiddenCode");
        const breakTheHiddenCode = await BreakTheHiddenCode.deploy();

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await breakTheHiddenCode["createGame()"]();
        await breakTheHiddenCode.connect(account2).joinGame();
        await breakTheHiddenCode.connect(account1).bet(gameId, {"value": oneEth});
        await breakTheHiddenCode.connect(account2).bet(gameId, {"value": oneEth});
        
        const codeMaker = await breakTheHiddenCode.codeMaker(gameId);
        let codeMakerAddress;
        let codeBreakerAddress;

        if (codeMaker === account1.address) {
            codeMakerAddress = account1;
            codeBreakerAddress = account2;
        } else {
            codeMakerAddress = account2;
            codeBreakerAddress = account1;
        }

        const salt = "V3ryL0ngS4ltV4lu3";

        return { breakTheHiddenCode, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, salt };
    }

    async function deployPublishedSecretFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const BreakTheHiddenCode = await hre.ethers.getContractFactory("BreakTheHiddenCode");
        const breakTheHiddenCode = await BreakTheHiddenCode.deploy();

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await breakTheHiddenCode["createGame()"]();
        await breakTheHiddenCode.connect(account2).joinGame();
        await breakTheHiddenCode.connect(account1).bet(gameId, {"value": oneEth});
        await breakTheHiddenCode.connect(account2).bet(gameId, {"value": oneEth});
        
        const codeMaker = await breakTheHiddenCode.codeMaker(gameId);
        let codeMakerAddress;
        let codeBreakerAddress;

        if (codeMaker === account1.address) {
            codeMakerAddress = account1;
            codeBreakerAddress = account2;
        } else {
            codeMakerAddress = account2;
            codeBreakerAddress = account1;
        }

        const salt = "V3ryL0ngS4ltV4lu3";
        const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));

        await breakTheHiddenCode.connect(codeMakerAddress).publishSecret(gameId, secret);


        const turnNumber = 0;
        const guessNumber = 0;

        return { breakTheHiddenCode, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, salt, turnNumber, guessNumber };
    }

    async function deployGuessedOnceFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const BreakTheHiddenCode = await hre.ethers.getContractFactory("BreakTheHiddenCode");
        const breakTheHiddenCode = await BreakTheHiddenCode.deploy();

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await breakTheHiddenCode["createGame()"]();
        await breakTheHiddenCode.connect(account2).joinGame();
        await breakTheHiddenCode.connect(account1).bet(gameId, {"value": oneEth});
        await breakTheHiddenCode.connect(account2).bet(gameId, {"value": oneEth});
        
        const codeMaker = await breakTheHiddenCode.codeMaker(gameId);
        let codeMakerAddress;
        let codeBreakerAddress;

        if (codeMaker === account1.address) {
            codeMakerAddress = account1;
            codeBreakerAddress = account2;
        } else {
            codeMakerAddress = account2;
            codeBreakerAddress = account1;
        }

        const salt = "V3ryL0ngS4ltV4lu3";
        const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));

        await breakTheHiddenCode.connect(codeMakerAddress).publishSecret(gameId, secret);

        const guess = ['B', 'R', 'Y', 'G', 'G'];
        const bytesColors = guess.map(c => hre.ethers.hexlify(hre.ethers.toUtf8Bytes(c).slice(0, 4)));

        await breakTheHiddenCode.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);

        const cc = 1;
        const nc = 4;
        const turnNumber = 0;
        const guessNumber = 0;

        return { breakTheHiddenCode, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, salt, cc, nc, turnNumber, guessNumber };
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

        it("Should fail when a user is trying to create a second game", async function () {
            const { breakTheHiddenCode } = await loadFixture(deployBthcAndCreateAGameFixture);

            await expect(breakTheHiddenCode["createGame()"]())
                .to.be.revertedWith(
                    "This address is already conneted to a game"
                );
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

        it("Should fail when a user is trying to create a game specifying an opponent but is already connected to a game", async function() {
            const { breakTheHiddenCode, account2 } = await loadFixture(deployBthcAndCreateAGameFixture);

            await expect(breakTheHiddenCode["createGame(address)"](account2))
                .to.be.revertedWith(
                    "This address is already conneted to a game"
                );
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
        describe("With a random opponent", function() {
            it("Should emit the event that a player joined", async function() {
                const { breakTheHiddenCode, account2 } = await loadFixture(deployBthcAndCreateMultipleGamesFixture);

                await expect(breakTheHiddenCode.connect(account2).joinGame())
                    .to.emit(breakTheHiddenCode, "UserJoined")
                    .withArgs(account2, anyValue);
            });

            it("Should fail because there are no existing games", async function() {
                const { breakTheHiddenCode } = await loadFixture(deployBreakTheHiddenCodeFixture);
    
                await expect(breakTheHiddenCode.joinGame())
                    .to.be.revertedWith(
                        "Currently there are no existing games"
                    );
            });

            it("Should fail because there are no more games to join", async function() {
                const { breakTheHiddenCode, account2, account3 } = await loadFixture(deployBthcAndCreateAGameFixture);

                await expect(breakTheHiddenCode.connect(account2).joinGame())
                    .to.emit(breakTheHiddenCode, "UserJoined")
                    .withArgs(account2, anyValue);

                await expect(breakTheHiddenCode.connect(account3).joinGame())
                    .to.be.revertedWith(
                        "There are no games to join"
                    );
            });
        });

        describe("With a specified opponent", function() {
            it("Should emit the event that the designated opponent joined", async function() {
                const { breakTheHiddenCode, account2 } = await loadFixture(deployBthcAndCreateAGameWithSpecificOpponentFixture);
    
                await expect(breakTheHiddenCode.connect(account2).joinGameById(0))
                    .to.emit(breakTheHiddenCode, "UserJoined")
                    .withArgs(account2, 0);
            });
    
            it("Should fail because there are no existing games", async function() {
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
                const { breakTheHiddenCode, account3 } = await loadFixture(deployBthcAndCreateAGameWithSpecificOpponentFixture);
    
                await expect(breakTheHiddenCode.connect(account3).joinGameById(0))
                    .to.be.revertedWith(
                        "Not authorized to join the game"
                    );
            });
        });
    });

    describe("Bet agreement", function () {
        describe("Bet", function () {
            it("Should emit Rise when a player does the first bet", async function () {
                const { breakTheHiddenCode, account1, gameId, oneEth } = await loadFixture(deployGameJoinedFixture);

                await expect(breakTheHiddenCode.bet(gameId, {"value": oneEth}))
                    .to.emit(breakTheHiddenCode, "Rise")
                    .withArgs(gameId, oneEth, account1);
            });

            it("Should emit Rise when a player rises the bet of the opponent", async function () {
                const { breakTheHiddenCode, account2, gameId, oneEth, twoEth } = await loadFixture(deployFirstBetFixture);

                await expect(breakTheHiddenCode.connect(account2).bet(gameId, {"value": twoEth}))
                    .to.emit(breakTheHiddenCode, "Rise")
                    .withArgs(gameId, oneEth, account2)
            });

            it("Should emit Check when a player matches the bet, then should emit CodeMakerSelected", async function () {
                const { breakTheHiddenCode, account2, gameId, oneEth } = await loadFixture(deployFirstBetFixture);

                const response = breakTheHiddenCode.connect(account2).bet(gameId, {"value": oneEth});
                await expect(response)
                    .to.emit(breakTheHiddenCode, "Check")
                    .withArgs(gameId, oneEth, account2);

                await expect(response)
                    .to.emit(breakTheHiddenCode, "CodeMakerSelected")
                    .withArgs(gameId, anyValue);
            });

            it("Should fail because the gameId doesn't exist", async function () {
                const { breakTheHiddenCode, oneEth } = await loadFixture(deployGameJoinedFixture);

                await expect(breakTheHiddenCode.bet(5, {"value": oneEth}))
                    .to.be.revertedWith(
                        "Game not found"
                    );
            });

            it("Should fail because the address is not playing", async function () {
                const { breakTheHiddenCode, gameId, oneEth, account3 } = await loadFixture(deployGameJoinedFixture);

                await expect(breakTheHiddenCode.connect(account3).bet(gameId, {"value": oneEth}))
                    .to.be.revertedWith(
                        "Not authorized to interact with this game"
                    );
            });

            it("Should fail because the address is trying to bet when it's not his turn", async function () {
                const { breakTheHiddenCode, account1, gameId, twoEth } = await loadFixture(deployFirstBetFixture);

                await expect(breakTheHiddenCode.connect(account1).bet(gameId, {"value": twoEth}))
                    .to.be.revertedWith(
                        "Invalid sender address. Not your turn"
                    );
            });
        });

        describe("Fold", function () {
            it("Should fold the bet and emit Fold", async function () {
                const { breakTheHiddenCode, account1, account2, nullAddress, gameId, oneEth } = await loadFixture(deployFirstBetFixture);

                const response = breakTheHiddenCode.connect(account2).fold(gameId);

                await expect(response)
                    .to.emit(breakTheHiddenCode, "Fold")
                    .withArgs(gameId, account2);

                await expect(response).to.changeEtherBalances(
                    [account1, account2],
                    [oneEth, 0]
                    );

                expect(await breakTheHiddenCode.games(gameId, "0")).to.equal(nullAddress);
                expect(await breakTheHiddenCode.games(gameId, "1")).to.equal(nullAddress);
            });

            it("Should fold the bet after a couple of bets and emit Fold", async function () {
                const { breakTheHiddenCode, account1, account2, gameId, oneEth, twoEth } = await loadFixture(deployCoupleBetsFixture);

                const response = breakTheHiddenCode.connect(account1).fold(gameId);

                await expect(response)
                    .to.emit(breakTheHiddenCode, "Fold")
                    .withArgs(gameId, account1);

                await expect(response).to.changeEtherBalances(
                    [account1, account2],
                    [oneEth, twoEth]
                    );
            });

            it("Should fail because the gameId doesn't exists", async function () {
                const { breakTheHiddenCode, account2 } = await loadFixture(deployFirstBetFixture);

                await expect(breakTheHiddenCode.connect(account2).fold(5))
                    .to.revertedWith(
                        "Game not found"
                    )
            });

            it("Should fail because the address is not authorized in that game", async function () {
                const { breakTheHiddenCode, account3, gameId } = await loadFixture(deployFirstBetFixture);

                await expect(breakTheHiddenCode.connect(account3).fold(gameId))
                    .to.revertedWith(
                        "Not authorized to interact with this game"
                    )
            });

            it("Should fail because it's not the turn of the address who is trying to fold", async function () {
                const { breakTheHiddenCode, gameId } = await loadFixture(deployFirstBetFixture);

                await expect(breakTheHiddenCode.fold(gameId))
                    .to.revertedWith(
                        "Invalid sender address. Not your turn"
                    )
            });

            it("Should fail because the address is trying to bet after a fold", async function () {
                const { breakTheHiddenCode, gameId, oneEth } = await loadFixture(deployFoldFixture);

                await expect(breakTheHiddenCode.bet(gameId, {"value": oneEth}))
                    .to.revertedWith(
                        "Game not found"
                    )
            });
        });

        describe("AFK", function () {
            it("Should emit Afk and gain all the Wei", async function () {
                const { breakTheHiddenCode, gameId, account2, oneEth, twoEth, afkDeadline, nullAddress } = await loadFixture(deployCoupleBetsFixture);

                await time.increaseTo(afkDeadline);

                const response = breakTheHiddenCode.connect(account2).issueAfk(gameId);

                await expect(response)
                    .to.emit(breakTheHiddenCode, "Afk")
                    .withArgs(gameId, account2);

                await expect(response).to.changeEtherBalances(
                    [account2],
                    [oneEth + twoEth]
                ); 

                expect(await breakTheHiddenCode.games(gameId, "0")).to.equal(nullAddress);
                expect(await breakTheHiddenCode.games(gameId, "1")).to.equal(nullAddress);
            });

            it("Should fail because the provided gameId does not exist", async function () {
                const { breakTheHiddenCode} = await loadFixture(deployCoupleBetsFixture);

                await expect(breakTheHiddenCode.issueAfk(5))
                    .to.revertedWith(
                        "Game not found"
                    );
            });

            it("Should fail because the issuing address is not authorized in that game", async function () {
                const { breakTheHiddenCode, account3, gameId} = await loadFixture(deployCoupleBetsFixture);

                await expect(breakTheHiddenCode.connect(account3).issueAfk(gameId))
                    .to.revertedWith(
                        "Not authorized to interact with this game"
                    );
            });

            it("Should fail because it's not the turn of the issuer", async function () {
                const { breakTheHiddenCode, account2, gameId} = await loadFixture(deployFirstBetFixture);

                await expect(breakTheHiddenCode.connect(account2).issueAfk(gameId))
                    .to.revertedWith(
                        "Invalid sender address. You can't issue the AFK status if it's your turn"
                    );
            });

            it("Should fail because the bet is not started yet", async function () {
                const { breakTheHiddenCode, account2, gameId} = await loadFixture(deployGameJoinedFixture);

                await expect(breakTheHiddenCode.connect(account2).issueAfk(gameId))
                    .to.revertedWith(
                        "Bet not started yet"
                    );
            });

            it("Should fail because the opponent still has time to make a bet", async function () {
                const { breakTheHiddenCode, gameId, account2 } = await loadFixture(deployCoupleBetsFixture);

                await expect(breakTheHiddenCode.connect(account2).issueAfk(gameId))
                    .to.revertedWith(
                        "The opponent still has time to make a choice"
                    )
            });

            it("Should fail because the address is trying to bet after an AFK", async function () {
                const { breakTheHiddenCode, gameId, oneEth } = await loadFixture(deployAfkFixture);

                await expect(breakTheHiddenCode.bet(gameId, {"value": oneEth}))
                    .to.revertedWith(
                        "Game not found"
                    )
            });
        });
    });

    describe("Secret publishment", function () {
        it("Should publish the secret of the code", async function() {
            const { breakTheHiddenCode, gameId, codeMakerAddress, salt } = await loadFixture(deployAgreedBetFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));

            await expect(breakTheHiddenCode.connect(codeMakerAddress).publishSecret(gameId, secret))
                .to.emit(breakTheHiddenCode, "SecretPublished")
                .withArgs(gameId);

            expect(await breakTheHiddenCode.secretCodeHash(gameId)).to.equal(secret);
        });

        it("Should fail because the game doesn't exists", async function () {
            const { breakTheHiddenCode } = await loadFixture(deployAgreedBetFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG"));

            await expect(breakTheHiddenCode.publishSecret(5, secret))
                .to.be.revertedWith(
                    "Game not found"
                );
        });

        it("Should fail because the account is not authorized to partecipate at the game", async function () {
            const { breakTheHiddenCode, account3, gameId } = await loadFixture(deployAgreedBetFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG"));

            await expect(breakTheHiddenCode.connect(account3).publishSecret(gameId, secret))
                .to.be.revertedWith(
                    "Not authorized to interact with this game"
                );
        });

        it("Should fail because the account is not the CodeMaker", async function () {
            const { breakTheHiddenCode, gameId, codeBreakerAddress } = await loadFixture(deployAgreedBetFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG"));

            await expect(breakTheHiddenCode.connect(codeBreakerAddress).publishSecret(gameId, secret))
                .to.be.revertedWith(
                    "Not the CodeMaker"
                );
        });

        it("Should fail because the address is trying to publish a secret before the bet is finished", async function () {
            const { breakTheHiddenCode, gameId } = await loadFixture(deployCoupleBetsFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG"));

            await expect(breakTheHiddenCode.publishSecret(gameId, secret))
                .to.be.revertedWith(
                    "Bet is not finished yet"
                );
        });

        it("Should fail because the codeMaker is trying to publish a secret after the bet was folded", async function () {
            const { breakTheHiddenCode, gameId } = await loadFixture(deployFoldFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG"));

            await expect(breakTheHiddenCode.publishSecret(gameId, secret))
                .to.be.revertedWith(
                    "Game not found"
                );
        });

        it("Should fail because the codeMaker is trying to publish a secret after the afk is issued", async function () {
            const { breakTheHiddenCode, gameId } = await loadFixture(deployAfkFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG"));

            await expect(breakTheHiddenCode.publishSecret(gameId, secret))
                .to.be.revertedWith(
                    "Game not found"
                );
        });
    });

    describe("Try guess", function () {
        it("Should propose a guess", async function () {
            const { breakTheHiddenCode, codeBreakerAddress, gameId, turnNumber, guessNumber } = await loadFixture(deployPublishedSecretFixture);

            const guess = ['B', 'R', 'Y', 'G', 'G'];
            const bytesColors = guess.map(c => hre.ethers.hexlify(hre.ethers.toUtf8Bytes(c).slice(0, 4)));

            await expect(breakTheHiddenCode.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
                .to.emit(breakTheHiddenCode, "Guess")
                .withArgs(gameId, bytesColors, turnNumber, guessNumber);
        });

        it("Should fail because the gameId provided is not correct", async function () {
            const { breakTheHiddenCode, codeBreakerAddress } = await loadFixture(deployPublishedSecretFixture);

            const guess = ['B', 'R', 'R', 'G', 'G'];
            const bytesColors = guess.map(c => hre.ethers.hexlify(hre.ethers.toUtf8Bytes(c).slice(0, 4)));

            await expect(breakTheHiddenCode.connect(codeBreakerAddress).tryGuess(5, bytesColors))
                .to.be.revertedWith(
                    "Game not found"
                );
        });

        it("Should fail because the account is not authorized to partecipate", async function () {
            const { breakTheHiddenCode, account3, gameId } = await loadFixture(deployPublishedSecretFixture);

            const guess = ['B', 'R', 'R', 'G', 'G'];
            const bytesColors = guess.map(c => hre.ethers.hexlify(hre.ethers.toUtf8Bytes(c).slice(0, 4)));

            await expect(breakTheHiddenCode.connect(account3).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "Not authorized to interact with this game"
                );
        });

        it("Should fail because the codeMaker can't try to guess the code", async function () {
            const { breakTheHiddenCode, codeMakerAddress, gameId } = await loadFixture(deployPublishedSecretFixture);

            const guess = ['B', 'R', 'R', 'G', 'G'];
            const bytesColors = guess.map(c => hre.ethers.hexlify(hre.ethers.toUtf8Bytes(c).slice(0, 4)));

            await expect(breakTheHiddenCode.connect(codeMakerAddress).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "Can't guess as CodeMaker"
                );
        });

        it("Should fail because the secret is not yet published", async function () {
            const { breakTheHiddenCode, codeBreakerAddress, gameId } = await loadFixture(deployAgreedBetFixture);

            const guess = ['B', 'R', 'R', 'G', 'G'];
            const bytesColors = guess.map(c => hre.ethers.hexlify(hre.ethers.toUtf8Bytes(c).slice(0, 4)));

            await expect(breakTheHiddenCode.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "The secret is not yet published"
                );
        });

        it("Should fail because the guess sequence has the wrong length", async function () {
            const { breakTheHiddenCode, codeBreakerAddress, gameId } = await loadFixture(deployPublishedSecretFixture);

            let guess = ['B', 'R', 'G', 'G'];
            let bytesColors = guess.map(c => hre.ethers.hexlify(hre.ethers.toUtf8Bytes(c).slice(0, 4)));

            await expect(breakTheHiddenCode.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "Code sequence length must be 5"
                );

            guess = ['B', 'R', 'G', 'G', 'G', 'B'];
            bytesColors = guess.map(c => hre.ethers.hexlify(hre.ethers.toUtf8Bytes(c).slice(0, 4)));

            await expect(breakTheHiddenCode.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "Code sequence length must be 5"
                );
        });

        it("Should fail because it has a non-ammissibile color in the guess", async function () {
            const { breakTheHiddenCode, codeBreakerAddress, gameId } = await loadFixture(deployPublishedSecretFixture);

            const guess = ['B', 'R', 'L', 'G', 'G'];
            const bytesColors = guess.map(c => hre.ethers.hexlify(hre.ethers.toUtf8Bytes(c).slice(0, 4)));

            await expect(breakTheHiddenCode.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "The colors provided are not valid"
                );
        });

        it("Should fail because the CodeBreaker tries to submit a new guess before receiving the feedback from the CodeMaker", async function () {
            const { breakTheHiddenCode, codeBreakerAddress, gameId } = await loadFixture(deployGuessedOnceFixture);

            const guess = ['B', 'B', 'Y', 'O', 'G'];
            const bytesColors = guess.map(c => hre.ethers.hexlify(hre.ethers.toUtf8Bytes(c).slice(0, 4)));

            await expect(breakTheHiddenCode.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "Guess already submitted. Wait for a feedback by the CodeMaker"
                );
        });
    });

    describe("Feedback", function () {
        it("Should emit Feedback after the CodeMaker publishes the feedback", async function () {
            const { breakTheHiddenCode, codeMakerAddress, gameId, cc, nc, turnNumber, guessNumber } = await loadFixture(deployGuessedOnceFixture);

            await expect(breakTheHiddenCode.connect(codeMakerAddress).publishFeedback(gameId, cc, nc))
                .to.emit(breakTheHiddenCode, "Feedback")
                .withArgs(gameId, cc, nc, turnNumber, guessNumber);
        });

        it("Should fail because the gameId provided doesn't exist", async function () {
            const { breakTheHiddenCode, codeMakerAddress, cc, nc } = await loadFixture(deployGuessedOnceFixture);

            await expect(breakTheHiddenCode.connect(codeMakerAddress).publishFeedback(5, cc, nc))
                .to.be.revertedWith(
                    "Game not found"
                );
        });

        it("Should fail because the address is not authorized to that game", async function () {
            const { breakTheHiddenCode, account3, gameId, cc, nc } = await loadFixture(deployGuessedOnceFixture);

            await expect(breakTheHiddenCode.connect(account3).publishFeedback(gameId, cc, nc))
                .to.be.revertedWith(
                    "Not authorized to interact with this game"
                );
        });

        it("Should fail because the CodeBreaker is trying to give a feedback", async function () {
            const { breakTheHiddenCode, codeBreakerAddress, gameId, cc, nc } = await loadFixture(deployGuessedOnceFixture);

            await expect(breakTheHiddenCode.connect(codeBreakerAddress).publishFeedback(gameId, cc, nc))
                .to.be.revertedWith(
                    "Can't give a feedback as CodeBreaker"
                );
        });

        it("Should fail because the guess is not submitted yet", async function () {
            const { breakTheHiddenCode, codeMakerAddress, gameId } = await loadFixture(deployPublishedSecretFixture);

            await expect(breakTheHiddenCode.connect(codeMakerAddress).publishFeedback(gameId, 3, 3))
                .to.be.revertedWith(
                    "Guess not submitted yet. Wait for a guess by the CodeBreaker"
                );
        });
    });

    describe("Withdraw", function () {
        //TODO Implement
    });
});
