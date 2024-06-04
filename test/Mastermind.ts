import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { getBytesColors, getPlayersRole } from "./MastermindUtils";

describe("Mastermind", function () {
    async function aTurn(mastermind: any, codeMakerAddress: any, codeBreakerAddress: any, gameId: any, colors: string, secret: any, bytesColors: any, firstAccount: any, secondAccount: any, changeTurn: boolean) {
        const salt = "V3ryL0ngS4ltV4lu3";
        let secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(colors + salt));

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 5, 0);
        await mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt);

        await mastermind.connect(firstAccount)["createGame()"]();
        await mastermind.connect(secondAccount)["createGame()"]();

        if (changeTurn)
            await mastermind.connect(codeMakerAddress).changeTurn(gameId);
    }

    async function deployMastermindFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        return { mastermind, nullAddress, account1, account2, account3 };
    }

    async function deployBthcAndCreateAGameFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        await mastermind["createGame()"]();

        const gameId = 0;

        return { mastermind, nullAddress, account1, account2, account3, gameId };
    }

    async function deployBthcAndCreateMultipleGamesFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        await mastermind.connect(account1)["createGame()"]();
        await mastermind.connect(account3)["createGame()"]();
        await mastermind.connect(account4)["createGame()"]();

        return { mastermind, nullAddress, account1, account2, account3 };
    }

    async function deployBthcAndCreateAGameWithSpecificOpponentFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        await mastermind["createGame(address)"](account2);

        const gameId = 0;

        return { mastermind, nullAddress, account1, account2, account3, gameId };
    }

    async function deployGameJoinedFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 2;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const halfEth = hre.ethers.parseEther("0.5");
        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();

        return { mastermind, gameId, nullAddress, account1, account2, account3, halfEth, oneEth, twoEth };
    }

    async function deployFirstBetFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const halfEth = hre.ethers.parseEther("0.5");
        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});

        return { mastermind, gameId, nullAddress, account1, account2, account3, halfEth, oneEth, twoEth };
    }

    async function deployFirstBetAndElapsedAfkFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 2;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const halfEth = hre.ethers.parseEther("0.5");
        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});

        await mastermind.connect(account1).emitAfk(gameId);
        await mastermind.connect(account3)["createGame()"]();
        await mastermind.connect(account4)["createGame()"]();

        return { mastermind, gameId, nullAddress, account1, account2, account3, halfEth, oneEth, twoEth };
    }

    async function deployCoupleBetsFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const halfEth = hre.ethers.parseEther("0.5");
        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": twoEth});

        return { mastermind, gameId, nullAddress, account1, account2, account3, halfEth, oneEth, twoEth };
    }

    async function deployFoldFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const halfEth = hre.ethers.parseEther("0.5");
        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).fold(gameId);

        return { mastermind, gameId, nullAddress, account1, account2, account3, halfEth, oneEth, twoEth };
    }

    async function deployAgreedBetFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";

        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, salt, turnNumber };
    }

    async function deployAgreedBetAndElapsedAfkFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 2;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);

        let { codeMakerAddress, codeBreakerAddress } = getPlayersRole(account1, account2, codeMaker);

        await mastermind.connect(codeBreakerAddress).emitAfk(gameId);

        await mastermind.connect(account3)["createGame()"]();
        await mastermind.connect(account4)["createGame()"]();

        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, turnNumber };
    }

    async function deployPublishedSecretFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});
        
        const turnNumber = 0;
        const guessNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secret);


        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, salt, turnNumber, guessNumber };
    }

    async function deployPublishedSecretAndElapsedAfkFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 2;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});
        
        const turnNumber = 0;
        const guessNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secret);
        
        await mastermind.connect(codeMakerAddress).emitAfk(gameId);
        await mastermind.connect(account3)["createGame()"]();
        await mastermind.connect(account4)["createGame()"]();

        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, salt, turnNumber, guessNumber };
    }

    async function deployGuessedOnceFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});
        
        const turnNumber = 0;
        const guessNumber = 0;

        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        const guess = ['B', 'R', 'Y', 'G', 'G'];
        const bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);

        const cc = 1;
        const nc = 4;

        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, secret, salt, cc, nc, turnNumber, guessNumber };
    }

    async function deployGuessedOnceAndElapsedAfkFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 2;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});
        
        const turnNumber = 0;
        const guessNumber = 0;

        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        const guess = ['B', 'R', 'Y', 'G', 'G'];
        const bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);

        await mastermind.connect(codeBreakerAddress).emitAfk(gameId);

        await mastermind.connect(account3)["createGame()"]();
        await mastermind.connect(account4)["createGame()"]();

        const cc = 1;
        const nc = 4;

        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, secret, salt, cc, nc, turnNumber, guessNumber };
    }

    async function deployCorrectGuessedAtFirstTryFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const disputeWindow = 2;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        await aTurn(mastermind, codeMakerAddress, codeBreakerAddress, gameId, "RGBRG", getBytesColors(['R', 'G', 'B', 'R', 'G']), getBytesColors(['R', 'G', 'B', 'R', 'G']), account3, account4, true);
                
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, codeMakerIndex, codeBreakerIndex, turnNumber };
    }

    async function deployCorrectGuessedAfterThreeTryFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const disputeWindow = 2;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);


        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        let guess = ['R', 'G', 'B', 'R', 'R'];
        let bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);

        guess = ['R', 'G', 'B', 'R', 'B'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);

        guess = ['R', 'G', 'B', 'R', 'G'];
        bytesColors = getBytesColors(guess);

        const cc = 5;
        const nc = 0;

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, cc, nc)
        await mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt);

        await mastermind.connect(account3)["createGame()"]();
        await mastermind.connect(account4)["createGame()"]();

        await mastermind.connect(codeMakerAddress).changeTurn(gameId);
        
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, salt, codeMakerIndex, codeBreakerIndex, cc, nc, twoEth };
    }

    async function deploySecretNotRevealedYetFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);


        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        let guess = ['R', 'G', 'B', 'R', 'R'];
        let bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);

        guess = ['R', 'G', 'B', 'R', 'B'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);

        guess = ['R', 'G', 'B', 'R', 'W'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);

        guess = ['R', 'G', 'B', 'R', 'O'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);

        guess = ['R', 'G', 'B', 'R', 'P'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);

        const cc = 4;
        const nc = 0;

        const guessReference = 3;
        
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, secret, salt, codeMakerIndex, codeBreakerIndex, cc, nc, turnNumber, twoEth, guessReference };
    }

    async function deployNotAbleToBreakCodeFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const disputeWindow = 2;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);


        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        let guess = ['R', 'G', 'B', 'R', 'R'];
        let bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);

        guess = ['R', 'G', 'B', 'R', 'B'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);

        guess = ['R', 'G', 'B', 'R', 'W'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);

        guess = ['R', 'G', 'B', 'R', 'O'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);

        guess = ['R', 'G', 'B', 'R', 'P'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);
        await mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt);

        await mastermind.connect(account3)["createGame()"]();
        await mastermind.connect(account4)["createGame()"]();

        await mastermind.connect(codeMakerAddress).changeTurn(gameId);

        const guessReference = 3;
        
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, secret, salt, codeMakerIndex, codeBreakerIndex, turnNumber, twoEth, guessReference };
    }

    async function deployCorrectGuessWithFeedbackFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        const guess = ['R', 'G', 'B', 'R', 'G'];
        const bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);

        const cc = 5;
        const nc = 0;

        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, cc, nc);
                
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, secret, salt, codeMakerIndex, codeBreakerIndex, cc, nc, turnNumber };
    }

    async function deployCorrectGuessWithFeedbackAndElapsedTimeFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 2;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        const guess = ['R', 'G', 'B', 'R', 'G'];
        const bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);

        const cc = 5;
        const nc = 0;

        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, cc, nc);

        await mastermind.connect(codeBreakerAddress).emitAfk(gameId);

        await mastermind.connect(account3)["createGame()"]();
        await mastermind.connect(account4)["createGame()"]();
                
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, secret, salt, codeMakerIndex, codeBreakerIndex, cc, nc, turnNumber };
    }

    async function deployFeedbackToNotCorrectGuessFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        const guess = ['R', 'G', 'B', 'R', 'Y'];
        const bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);

        const cc = 4;
        const nc = 0;

        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, cc, nc);
                
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, secret, salt, codeMakerIndex, codeBreakerIndex, cc, nc, turnNumber };
    }

    async function deployDishonestCodeMakerFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);
        const wrongSecret = getBytesColors(['R', 'G', 'B', 'R', 'Y']);


        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        const cc = 4;
        const nc = 0;

        let guess = ['R', 'G', 'B', 'R', 'R'];
        let bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, cc, nc);

        guess = ['R', 'G', 'B', 'R', 'B'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, cc, nc);

        guess = ['R', 'G', 'B', 'R', 'W'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, cc, nc);

        guess = ['R', 'G', 'B', 'R', 'O'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, cc, nc);

        guess = ['R', 'G', 'B', 'R', 'P'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, cc, nc);

        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, secret, wrongSecret, salt, codeMakerIndex, codeBreakerIndex, cc, nc, turnNumber, twoEth };
    }

    async function deployRevealSecretWithHonestCodeMakerFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        let guess = ['G', 'G', 'B', 'Y', 'R'];
        let bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 2, 2);

        guess = ['G', 'B', 'B', 'Y', 'R'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 1, 2);

        guess = ['R', 'G', 'B', 'Y', 'R'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 3, 1);

        guess = ['R', 'G', 'B', 'R', 'O'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);

        guess = ['R', 'G', 'B', 'R', 'P'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);

        await mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt);

        const disputeIndex = 3;
                
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, secret, salt, codeMakerIndex, codeBreakerIndex, turnNumber, disputeIndex, twoEth };
    }

    async function deployRevealSecretWithLessGuessWithHonestCodeMakerFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        let guess = ['G', 'G', 'B', 'Y', 'R'];
        let bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 2, 2);

        guess = ['G', 'B', 'B', 'Y', 'R'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 1, 2);

        guess = ['R', 'G', 'B', 'Y', 'R'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 5, 0);

        await mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt);

        const disputeIndex = 3;
                
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, secret, salt, codeMakerIndex, codeBreakerIndex, turnNumber, disputeIndex, twoEth };
    }

    async function deployRevealSecretWithElapsedDisputeTimeFixture() {
        const [account1, account2, account3, account4, account5, account6] = await hre.ethers.getSigners();

        const disputeWindow = 2;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        let guess = ['G', 'G', 'B', 'Y', 'R'];
        let bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 2, 2);

        guess = ['G', 'B', 'B', 'Y', 'R'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 1, 2);

        guess = ['R', 'G', 'B', 'Y', 'R'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 5, 0);

        await mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt);

        const disputeIndex = 2;

        await mastermind.connect(account3)["createGame()"]();
        await mastermind.connect(account4)["createGame()"]();
        await mastermind.connect(account5)["createGame()"]();
        await mastermind.connect(account6)["createGame()"]();
                
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, secret, salt, codeMakerIndex, codeBreakerIndex, turnNumber, disputeIndex, twoEth };
    }

    async function deployRevealSecretWithElapsedDisputeTimeAndAfkFixture() {
        const [account1, account2, account3, account4, account5, account6, account7, account8] = await hre.ethers.getSigners();

        const disputeWindow = 2;
        const afkWindow = 2;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        let guess = ['G', 'G', 'B', 'Y', 'R'];
        let bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 2, 2);

        guess = ['G', 'B', 'B', 'Y', 'R'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 1, 2);

        guess = ['R', 'G', 'B', 'Y', 'R'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 5, 0);

        await mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt);

        const disputeIndex = 2;

        await mastermind.connect(account3)["createGame()"]();
        await mastermind.connect(account4)["createGame()"]();
        await mastermind.connect(account5)["createGame()"]();
        await mastermind.connect(account6)["createGame()"]();

        await mastermind.connect(codeBreakerAddress).emitAfk(gameId);

        await mastermind.connect(account7)["createGame()"]();
        await mastermind.connect(account8)["createGame()"]();
                
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, secret, salt, codeMakerIndex, codeBreakerIndex, turnNumber, disputeIndex, twoEth };
    }

    async function deployRevealSecretWithDishonestCodeMakerFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'G']);

        await mastermind.connect(codeMakerAddress).publishSecret(gameId, secretHash);

        let guess = ['G', 'G', 'B', 'Y', 'R'];
        let bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 2, 2);

        guess = ['G', 'B', 'B', 'Y', 'R'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 1, 2);

        guess = ['R', 'G', 'B', 'Y', 'R'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 3, 1);

        guess = ['R', 'G', 'B', 'R', 'O'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 3, 2);

        guess = ['R', 'G', 'B', 'R', 'P'];
        bytesColors = getBytesColors(guess);

        await mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors);
        await mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0);

        await mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt);

        const disputeIndex = 3;
                
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, secret, salt, codeMakerIndex, codeBreakerIndex, turnNumber, disputeIndex, twoEth };
    }

    async function deployGameFinishedWithATieFixture() {
        const [account1, account2, account3, account4, account5, account6, account7, account8, account9, account10] = await hre.ethers.getSigners();

        const disputeWindow = 2;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        await aTurn(mastermind, codeMakerAddress, codeBreakerAddress, gameId, "RGBRG", getBytesColors(['R', 'G', 'B', 'R', 'G']), getBytesColors(['R', 'G', 'B', 'R', 'G']), account3, account4, true);
        await aTurn(mastermind, codeBreakerAddress, codeMakerAddress, gameId, "RGBRB", getBytesColors(['R', 'G', 'B', 'R', 'B']), getBytesColors(['R', 'G', 'B', 'R', 'B']), account5, account6, true);
        await aTurn(mastermind, codeMakerAddress, codeBreakerAddress, gameId, "RGBRW", getBytesColors(['R', 'G', 'B', 'R', 'W']), getBytesColors(['R', 'G', 'B', 'R', 'W']), account7, account8, true);
        await aTurn(mastermind, codeBreakerAddress, codeMakerAddress, gameId, "RGBRY", getBytesColors(['R', 'G', 'B', 'R', 'Y']), getBytesColors(['R', 'G', 'B', 'R', 'Y']), account9, account10, false);
                
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, codeMakerIndex, codeBreakerIndex, turnNumber, oneEth };
    }

    async function deployGameFinishedWithoutLastTurnChangeFixture() {
        const [account1, account2, account3, account4, account5, account6, account7, account8, account9, account10] = await hre.ethers.getSigners();

        const disputeWindow = 2;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        await aTurn(mastermind, codeMakerAddress, codeBreakerAddress, gameId, "RGBRG", getBytesColors(['R', 'G', 'B', 'R', 'G']), getBytesColors(['R', 'G', 'B', 'R', 'G']), account3, account4, true);
        await aTurn(mastermind, codeBreakerAddress, codeMakerAddress, gameId, "RGBRB", getBytesColors(['R', 'G', 'B', 'R', 'B']), getBytesColors(['R', 'G', 'B', 'R', 'B']), account5, account6, true);
        await aTurn(mastermind, codeMakerAddress, codeBreakerAddress, gameId, "RGBRW", getBytesColors(['R', 'G', 'B', 'R', 'W']), getBytesColors(['R', 'G', 'B', 'R', 'W']), account7, account8, true);
        
        const salt = "V3ryL0ngS4ltV4lu3";
        const secretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRY" + salt));
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'Y']);

        await mastermind.connect(codeBreakerAddress).publishSecret(gameId, secretHash);

        let guess = getBytesColors(['R', 'G', 'B', 'R', 'W']);
        await mastermind.connect(codeMakerAddress).tryGuess(gameId, guess);
        await mastermind.connect(codeBreakerAddress).publishFeedback(gameId, 4, 0);

        guess = getBytesColors(['R', 'G', 'B', 'R', 'Y']);
        await mastermind.connect(codeMakerAddress).tryGuess(gameId, guess);
        await mastermind.connect(codeBreakerAddress).publishFeedback(gameId, 5, 0);
        await mastermind.connect(codeBreakerAddress).revealSecret(gameId, secret, salt);

        await mastermind.connect(account9)["createGame()"]();
        await mastermind.connect(account10)["createGame()"]();

        const winner = codeBreakerAddress;
                
        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, codeMakerIndex, codeBreakerIndex, turnNumber, twoEth, winner };
    }

    async function deployGameFinishedFixture() {
        const [account1, account2, account3, account4, account5, account6, account7, account8, account9, account10] = await hre.ethers.getSigners();

        const disputeWindow = 2;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});
        await mastermind.connect(account2).bet(gameId, {"value": oneEth});

        const turnNumber = 0;
        
        const codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);
        let { codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex } = getPlayersRole(account1, account2, codeMaker);

        await aTurn(mastermind, codeMakerAddress, codeBreakerAddress, gameId, "RGBRG", getBytesColors(['R', 'G', 'B', 'R', 'G']), getBytesColors(['R', 'G', 'B', 'R', 'G']), account3, account4, true);
        await aTurn(mastermind, codeBreakerAddress, codeMakerAddress, gameId, "RGBRB", getBytesColors(['R', 'G', 'B', 'R', 'B']), getBytesColors(['R', 'G', 'B', 'R', 'B']), account5, account6, true);
        await aTurn(mastermind, codeMakerAddress, codeBreakerAddress, gameId, "RGBRW", getBytesColors(['R', 'G', 'B', 'R', 'W']), getBytesColors(['R', 'G', 'B', 'R', 'W']), account7, account8, true);
        await aTurn(mastermind, codeBreakerAddress, codeMakerAddress, gameId, "RGBRY", getBytesColors(['R', 'G', 'B', 'R', 'Y']), getBytesColors(['R', 'G', 'B', 'R', 'Y']), account9, account10, true);
                
        const cc = 5;
        const nc = 0;

        const salt = "V3ryL0ngS4ltV4lu3";
        const secret = getBytesColors(['R', 'G', 'B', 'R', 'Y']);

        const disputeIndex = 1;

        return { mastermind, nullAddress, account1, account2, account3, gameId, codeBreakerAddress, codeMakerAddress, codeMakerIndex, codeBreakerIndex, turnNumber, twoEth, cc, nc, salt, secret, disputeIndex };
    }

    async function deployEmittedAfkFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});

        await mastermind.connect(account1).emitAfk(gameId);
                
        return { mastermind, nullAddress, account1, account2, account3, gameId};
    }

    async function deployEmittedAfkWithShortTimerFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 2;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});

        await mastermind.connect(account1).emitAfk(gameId);

        await mastermind.connect(account3)["createGame()"]();
        await mastermind.connect(account4)["createGame()"]();
                
        return { mastermind, nullAddress, account1, account2, account3, gameId, oneEth };
    }

    async function deployEmittedAfkWithOpponentMoveFixture() {
        const [account1, account2, account3] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const gameId = 0;
        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");

        await mastermind["createGame()"]();
        await mastermind.connect(account2).joinGame();
        await mastermind.connect(account1).bet(gameId, {"value": oneEth});

        await mastermind.connect(account1).emitAfk(gameId);

        await mastermind.connect(account2).bet(gameId, {"value": oneEth});
                
        return { mastermind, nullAddress, account1, account2, account3, gameId};
    }

    describe("Game creation", function () {
        it("Should create a game with gameId equal to 0 and the creator of the game is the only one connected", async function () {
            const { mastermind, account1, nullAddress } = await loadFixture(deployMastermindFixture);

            const createGameResposnse = mastermind["createGame()"]();

            await expect(createGameResposnse)
                .to.emit(mastermind, "GameCreated")
                .withArgs(0);

            expect(await mastermind.getPlayerAddress("0", "0")).to.equal(account1.address);
            expect(await mastermind.getPlayerAddress("0", "1")).to.equal(nullAddress);
            expect(await mastermind.getInvitedPlayer("0")).to.equal(nullAddress);
        });

        it("Should fail when a user is trying to create a second game", async function () {
            const { mastermind } = await loadFixture(deployBthcAndCreateAGameFixture);

            await expect(mastermind["createGame()"]())
                .to.be.revertedWith(
                    "This address is already conneted to a game"
                );
        });

        it("Should create a game for a specific opponent with gameId equal to 0 and in the mapping is present the creator (pos. 0) and the invited account (pos. 2)", async function () {
            const { mastermind, account1, account2, nullAddress} = await loadFixture(deployMastermindFixture);

            await expect(mastermind["createGame(address)"](account2))
                .to.emit(mastermind, "GameCreatedForAnOpponent")
                .withArgs(0, account2);

            expect(await mastermind.getPlayerAddress("0", "0")).to.equal(account1.address);
            expect(await mastermind.getPlayerAddress("0", "1")).to.equal(nullAddress);
            expect(await mastermind.getInvitedPlayer("0")).to.equal(account2);
        });

        it("Should fail when a user is trying to create a game specifying an opponent but is already connected to a game", async function() {
            const { mastermind, account2 } = await loadFixture(deployBthcAndCreateAGameFixture);

            await expect(mastermind["createGame(address)"](account2))
                .to.be.revertedWith(
                    "This address is already conneted to a game"
                );
        });

        it("Should fail with opponent address null", async function () {
            const { mastermind, nullAddress} = await loadFixture(deployMastermindFixture);

            await expect(mastermind["createGame(address)"](nullAddress))
                .to.be.revertedWith(
                    "Invalid opponent address"
                );
        });

        it("Should fail with opponent address equal to the sender address", async function () {
            const { mastermind, account1} = await loadFixture(deployMastermindFixture);

            await expect(mastermind["createGame(address)"](account1))
                .to.be.revertedWith(
                    "Can't create a game with yourself"
                );
        })
    });

    describe("Join game", function () {
        describe("With a random opponent", function() {
            it("Should emit the event that a player joined", async function() {
                const { mastermind, account2 } = await loadFixture(deployBthcAndCreateMultipleGamesFixture);

                await expect(mastermind.connect(account2).joinGame())
                    .to.emit(mastermind, "UserJoined")
                    .withArgs(account2, anyValue);
            });

            it("Should fail because there are no existing games", async function() {
                const { mastermind } = await loadFixture(deployMastermindFixture);
    
                await expect(mastermind.joinGame())
                    .to.be.revertedWith(
                        "Currently there are no existing games"
                    );
            });

            it("Should fail because there are no more games to join", async function() {
                const { mastermind, account2, account3 } = await loadFixture(deployBthcAndCreateAGameFixture);

                await expect(mastermind.connect(account2).joinGame())
                    .to.emit(mastermind, "UserJoined")
                    .withArgs(account2, anyValue);

                await expect(mastermind.connect(account3).joinGame())
                    .to.be.revertedWith(
                        "There are no games to join"
                    );
            });
        });

        describe("With a specified opponent", function() {
            it("Should emit the event that the designated opponent joined", async function() {
                const { mastermind, account2 } = await loadFixture(deployBthcAndCreateAGameWithSpecificOpponentFixture);
    
                await expect(mastermind.connect(account2).joinGameById(0))
                    .to.emit(mastermind, "UserJoined")
                    .withArgs(account2, 0);
            });
    
            it("Should fail because there are no existing games", async function() {
                const { mastermind, account2 } = await loadFixture(deployMastermindFixture);
    
                await expect(mastermind.connect(account2).joinGameById(0))
                    .to.be.revertedWith(
                        "Currently there are no existing games"
                    );
            });
    
            it("Should fail because the provided game doesn not exist", async function() {
                const { mastermind, account2 } = await loadFixture(deployBthcAndCreateAGameWithSpecificOpponentFixture);
    
                await expect(mastermind.connect(account2).joinGameById(1))
                    .to.be.revertedWith(
                        "Game doesn't exists"
                    );
            });
    
            it("Should fail because the address is not authorized to join", async function() {
                const { mastermind, account3 } = await loadFixture(deployBthcAndCreateAGameWithSpecificOpponentFixture);
    
                await expect(mastermind.connect(account3).joinGameById(0))
                    .to.be.revertedWith(
                        "Not authorized to join the game"
                    );
            });
        });
    });

    describe("Quit game", function () {
        it("Should quit a game created with a random opponent", async function () {
            const { mastermind, account1, gameId } = await loadFixture(deployBthcAndCreateAGameFixture);

            await expect(mastermind.connect(account1).quitGame(gameId))
                .to.emit(mastermind, "Disconnected")
                .withArgs(account1);
        });

        it("Should quit a game created with a specific opponent", async function () {
            const { mastermind, account1, gameId } = await loadFixture(deployBthcAndCreateAGameWithSpecificOpponentFixture);

            await expect(mastermind.connect(account1).quitGame(gameId))
                .to.emit(mastermind, "Disconnected")
                .withArgs(account1);
        });

        it("Should fail because there are no existing games", async function () {
            const { mastermind, account1 } = await loadFixture(deployMastermindFixture);

            await expect(mastermind.connect(account1).quitGame(0))
                .to.revertedWith(
                    "Currently there are no existing games"
                );
        });

        it("Should fail because the address is not the creator of the game associated with the gameId", async function () {
            const { mastermind, account2, gameId } = await loadFixture(deployBthcAndCreateAGameFixture);

            await expect(mastermind.connect(account2).quitGame(gameId))
                .to.revertedWith(
                    "The provided gameId is not associated to the address"
                );
        });

        it("Should fail because the opponent already connected to the game", async function () {
            const { mastermind, account1, gameId } = await loadFixture(deployGameJoinedFixture);

            await expect(mastermind.connect(account1).quitGame(gameId))
                .to.revertedWith(
                    "The game started"
                );
        });
    });

    describe("Bet agreement", function () {
        describe("Bet", function () {
            it("Should emit Rise when a player does the first bet", async function () {
                const { mastermind, account1, gameId, oneEth } = await loadFixture(deployGameJoinedFixture);

                await expect(mastermind.bet(gameId, {"value": oneEth}))
                    .to.emit(mastermind, "Rise")
                    .withArgs(gameId, oneEth, account1);
            });

            it("Should emit Rise when a player rises the bet of the opponent", async function () {
                const { mastermind, account2, gameId, oneEth, twoEth } = await loadFixture(deployFirstBetFixture);

                await expect(mastermind.connect(account2).bet(gameId, {"value": twoEth}))
                    .to.emit(mastermind, "Rise")
                    .withArgs(gameId, oneEth, account2)
            });

            it("Should emit Check when a player matches the bet, then should emit CodeMakerSelected", async function () {
                const { mastermind, account2, gameId, oneEth, twoEth } = await loadFixture(deployFirstBetFixture);

                const response = mastermind.connect(account2).bet(gameId, {"value": oneEth});
                await expect(response)
                    .to.emit(mastermind, "Check")
                    .withArgs(gameId, twoEth, account2);

                await expect(response)
                    .to.emit(mastermind, "CodeMakerSelected")
                    .withArgs(gameId, anyValue);
            });

            it("Should fail because the gameId doesn't exist", async function () {
                const { mastermind, oneEth } = await loadFixture(deployGameJoinedFixture);

                await expect(mastermind.bet(5, {"value": oneEth}))
                    .to.be.revertedWith(
                        "Game not found"
                    );
            });

            it("Should fail because the address is not playing", async function () {
                const { mastermind, gameId, oneEth, account3 } = await loadFixture(deployGameJoinedFixture);

                await expect(mastermind.connect(account3).bet(gameId, {"value": oneEth}))
                    .to.be.revertedWith(
                        "Not authorized to interact with this game"
                    );
            });

            it("Should fail because the game is finished", async function () {
                const { mastermind, account1, gameId, twoEth } = await loadFixture(deployGameFinishedFixture);

                await expect(mastermind.connect(account1).bet(gameId, {"value": twoEth}))
                    .to.be.revertedWith(
                        "The game is finished"
                    );
            });

            it("Should fail because the address is trying to bet when it's not his turn", async function () {
                const { mastermind, account1, gameId, twoEth } = await loadFixture(deployFirstBetFixture);

                await expect(mastermind.connect(account1).bet(gameId, {"value": twoEth}))
                    .to.be.revertedWith(
                        "Invalid sender address. Not your turn"
                    );
            });

            it("Should fail because the address is trying to bet after the AFK elapsed", async function () {
                const { mastermind, account2, gameId, twoEth } = await loadFixture(deployFirstBetAndElapsedAfkFixture);

                await expect(mastermind.connect(account2).bet(gameId, {"value": twoEth}))
                    .to.be.revertedWith(
                        "Can't execute this function because the AFK dispute elapsed without a move"
                    );
            });
        });

        describe("Fold", function () {
            it("Should fold the bet and emit Fold", async function () {
                const { mastermind, account1, account2, nullAddress, gameId, oneEth } = await loadFixture(deployFirstBetFixture);

                const response = mastermind.connect(account2).fold(gameId);

                await expect(response)
                    .to.emit(mastermind, "Fold")
                    .withArgs(gameId, account2);

                await expect(response).to.changeEtherBalance(account1, oneEth);

                expect(await mastermind.isGameFinished(gameId)).to.equal(true);
                expect(await mastermind.isGameTied(gameId)).to.be.equal(false);
            });

            it("Should fold the bet after a couple of bets and emit Fold", async function () {
                const { mastermind, account1, account2, gameId, oneEth, twoEth } = await loadFixture(deployCoupleBetsFixture);

                const response = mastermind.connect(account1).fold(gameId);

                await expect(response)
                    .to.emit(mastermind, "Fold")
                    .withArgs(gameId, account1);

                await expect(response).to.changeEtherBalances(
                    [account1, account2],
                    [oneEth, twoEth]
                    );
            });

            it("Should fail because the gameId doesn't exists", async function () {
                const { mastermind, account2 } = await loadFixture(deployFirstBetFixture);

                await expect(mastermind.connect(account2).fold(5))
                    .to.revertedWith(
                        "Game not found"
                    )
            });

            it("Should fail because the address is not authorized in that game", async function () {
                const { mastermind, account3, gameId } = await loadFixture(deployFirstBetFixture);

                await expect(mastermind.connect(account3).fold(gameId))
                    .to.revertedWith(
                        "Not authorized to interact with this game"
                    )
            });

            it("Should fail because the game is finished", async function () {
                const { mastermind, account1, gameId } = await loadFixture(deployGameFinishedFixture);

                await expect(mastermind.connect(account1).fold(gameId))
                    .to.be.revertedWith(
                        "The game is finished"
                    );
            });

            it("Should fail because it's not the turn of the address who is trying to fold", async function () {
                const { mastermind, gameId } = await loadFixture(deployFirstBetFixture);

                await expect(mastermind.fold(gameId))
                    .to.revertedWith(
                        "Invalid sender address. Not your turn"
                    )
            });

            it("Should fail because the address is trying to bet after a fold", async function () {
                const { mastermind, gameId, oneEth } = await loadFixture(deployFoldFixture);

                await expect(mastermind.bet(gameId, {"value": oneEth}))
                    .to.revertedWith(
                        "The game is finished"
                    )
            });

            it("Should fail because the address is trying to fold after the AFK elapsed", async function () {
                const { mastermind, gameId, account2 } = await loadFixture(deployFirstBetAndElapsedAfkFixture);

                await expect(mastermind.connect(account2).fold(gameId))
                    .to.revertedWith(
                        "Can't execute this function because the AFK dispute elapsed without a move"
                    )
            });
        });
    });

    describe("Secret publishment", function () {
        it("Should publish the secret of the code", async function() {
            const { mastermind, gameId, codeMakerAddress, salt, turnNumber } = await loadFixture(deployAgreedBetFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));

            await expect(mastermind.connect(codeMakerAddress).publishSecret(gameId, secret))
                .to.emit(mastermind, "SecretPublished")
                .withArgs(gameId, secret);

            expect(await mastermind.getSecretCodeHash(gameId, turnNumber)).to.equal(secret);
        });

        it("Should fail because the game doesn't exists", async function () {
            const { mastermind } = await loadFixture(deployAgreedBetFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG"));

            await expect(mastermind.publishSecret(5, secret))
                .to.be.revertedWith(
                    "Game not found"
                );
        });

        it("Should fail because the account is not authorized to partecipate at the game", async function () {
            const { mastermind, account3, gameId } = await loadFixture(deployAgreedBetFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG"));

            await expect(mastermind.connect(account3).publishSecret(gameId, secret))
                .to.be.revertedWith(
                    "Not authorized to interact with this game"
                );
        });

        it("Should fail because the game is finished", async function () {
            const { mastermind, account1, gameId } = await loadFixture(deployGameFinishedFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG"));

            await expect(mastermind.connect(account1).publishSecret(gameId, secret))
                .to.be.revertedWith(
                    "The game is finished"
                );
        });

        it("Should fail because the address is trying to publish a secret before the bet is finished", async function () {
            const { mastermind, gameId } = await loadFixture(deployCoupleBetsFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG"));

            await expect(mastermind.publishSecret(gameId, secret))
                .to.be.revertedWith(
                    "Bet is not finished yet"
                );
        });

        it("Should fail because the address is trying to publish a secret two times in a row", async function() {
            const { mastermind, gameId, codeMakerAddress, salt, turnNumber } = await loadFixture(deployPublishedSecretFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG" + salt));

            await expect(mastermind.connect(codeMakerAddress).publishSecret(gameId, secret))
                .to.be.revertedWith(
                    "Not your turn"
                );
        });

        it("Should fail because the codeMaker is trying to publish a secret after the bet was folded", async function () {
            const { mastermind, gameId } = await loadFixture(deployFoldFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG"));

            await expect(mastermind.publishSecret(gameId, secret))
                .to.be.revertedWith(
                    "The game is finished"
                );
        });

        it("Should fail because the codeMaker is trying to publish a secret after the afk is issued", async function () {
            const { mastermind, codeMakerAddress, gameId } = await loadFixture(deployAgreedBetAndElapsedAfkFixture);

            const secret = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RGBRG"));

            await expect(mastermind.connect(codeMakerAddress).publishSecret(gameId, secret))
                .to.be.revertedWith(
                    "Can't execute this function because the AFK dispute elapsed without a move"
                );
        });
    });

    describe("Try guess", function () {
        it("Should propose a guess", async function () {
            const { mastermind, codeBreakerAddress, gameId, turnNumber, guessNumber } = await loadFixture(deployPublishedSecretFixture);

            const guess = ['B', 'R', 'Y', 'G', 'G'];
            const bytesColors = getBytesColors(guess);

            await expect(mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
                .to.emit(mastermind, "Guess")
                .withArgs(gameId, bytesColors, turnNumber, guessNumber);
        });

        it("Should fail because the gameId provided is not correct", async function () {
            const { mastermind, codeBreakerAddress } = await loadFixture(deployPublishedSecretFixture);

            const guess = ['B', 'R', 'R', 'G', 'G'];
            const bytesColors = getBytesColors(guess);

            await expect(mastermind.connect(codeBreakerAddress).tryGuess(5, bytesColors))
                .to.be.revertedWith(
                    "Game not found"
                );
        });

        it("Should fail because the account is not authorized to partecipate", async function () {
            const { mastermind, account3, gameId } = await loadFixture(deployPublishedSecretFixture);

            const guess = ['B', 'R', 'R', 'G', 'G'];
            const bytesColors = getBytesColors(guess);

            await expect(mastermind.connect(account3).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "Not authorized to interact with this game"
                );
        });

        it("Should fail because the game is finished", async function () {
            const { mastermind, account1, gameId } = await loadFixture(deployGameFinishedFixture);

            const guess = ['B', 'R', 'R', 'G', 'G'];
            const bytesColors = getBytesColors(guess);

            await expect(mastermind.connect(account1).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "The game is finished"
                );
        });

        it("Should fail because the codeMaker can't try to guess the code", async function () {
            const { mastermind, codeMakerAddress, gameId } = await loadFixture(deployPublishedSecretFixture);

            const guess = ['B', 'R', 'R', 'G', 'G'];
            const bytesColors = getBytesColors(guess);

            await expect(mastermind.connect(codeMakerAddress).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "Can't guess as CodeMaker"
                );
        });

        it("Should fail because the secret is not yet published", async function () {
            const { mastermind, codeBreakerAddress, gameId } = await loadFixture(deployAgreedBetFixture);

            const guess = ['B', 'R', 'R', 'G', 'G'];
            const bytesColors = getBytesColors(guess);

            await expect(mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "The secret is not yet published"
                );
        });

        it("Should fail because the guess sequence has the wrong length", async function () {
            const { mastermind, codeBreakerAddress, gameId } = await loadFixture(deployPublishedSecretFixture);

            let guess = ['B', 'R', 'G', 'G'];
            let bytesColors = getBytesColors(guess);

            await expect(mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "Code sequence length must be 5"
                );

            guess = ['B', 'R', 'G', 'G', 'G', 'B'];
            bytesColors = getBytesColors(guess);

            await expect(mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "Code sequence length must be 5"
                );
        });

        it("Should fail because it has a non-ammissibile color in the guess", async function () {
            const { mastermind, codeBreakerAddress, gameId } = await loadFixture(deployPublishedSecretFixture);

            const guess = ['B', 'R', 'L', 'G', 'G'];
            const bytesColors = getBytesColors(guess);

            await expect(mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "The colors provided are not valid"
                );
        });

        it("Should fail because the CodeBreaker tries to submit a new guess before receiving the feedback from the CodeMaker", async function () {
            const { mastermind, codeBreakerAddress, gameId } = await loadFixture(deployGuessedOnceFixture);

            const guess = ['B', 'B', 'Y', 'O', 'G'];
            const bytesColors = getBytesColors(guess);

            await expect(mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "Guess already submitted. Wait for a feedback by the CodeMaker"
                );
        });

        it("Should fail because the CodeBreaker tries to submit a guess after the Akf elapsed", async function () {
            const { mastermind, codeBreakerAddress, gameId } = await loadFixture(deployPublishedSecretAndElapsedAfkFixture);

            const guess = ['B', 'B', 'Y', 'O', 'G'];
            const bytesColors = getBytesColors(guess);
            
            await expect(mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
                .to.be.revertedWith(
                    "Can't execute this function because the AFK dispute elapsed without a move"
                );
        });
    });

    describe("Feedback", function () {
        it("Should emit Feedback after the CodeMaker publishes the feedback", async function () {
            const { mastermind, codeMakerAddress, gameId, cc, nc, turnNumber, guessNumber } = await loadFixture(deployGuessedOnceFixture);

            await expect(mastermind.connect(codeMakerAddress).publishFeedback(gameId, cc, nc))
                .to.emit(mastermind, "Feedback")
                .withArgs(gameId, cc, nc, turnNumber, guessNumber);
        });

        it("Should fail because the gameId provided doesn't exist", async function () {
            const { mastermind, codeMakerAddress, cc, nc } = await loadFixture(deployGuessedOnceFixture);

            await expect(mastermind.connect(codeMakerAddress).publishFeedback(5, cc, nc))
                .to.be.revertedWith(
                    "Game not found"
                );
        });

        it("Should fail because the address is not authorized to that game", async function () {
            const { mastermind, account3, gameId, cc, nc } = await loadFixture(deployGuessedOnceFixture);

            await expect(mastermind.connect(account3).publishFeedback(gameId, cc, nc))
                .to.be.revertedWith(
                    "Not authorized to interact with this game"
                );
        });

        it("Should fail because the game is finished", async function () {
            const { mastermind, account1, gameId, cc, nc } = await loadFixture(deployGameFinishedFixture);

            await expect(mastermind.connect(account1).publishFeedback(gameId, cc, nc))
                .to.be.revertedWith(
                    "The game is finished"
                );
        });

        it("Should fail because the CodeBreaker is trying to give a feedback", async function () {
            const { mastermind, codeBreakerAddress, gameId, cc, nc } = await loadFixture(deployGuessedOnceFixture);

            await expect(mastermind.connect(codeBreakerAddress).publishFeedback(gameId, cc, nc))
                .to.be.revertedWith(
                    "Can't give a feedback as CodeBreaker"
                );
        });

        it("Should fail because the guess is not submitted yet", async function () {
            const { mastermind, codeMakerAddress, gameId } = await loadFixture(deployPublishedSecretFixture);

            await expect(mastermind.connect(codeMakerAddress).publishFeedback(gameId, 3, 3))
                .to.be.revertedWith(
                    "Guess not submitted yet. Wait for a guess by the CodeBreaker"
                );
        });

        it("Should fail because the CodeMaker sent the feedback after the Afk elapsed", async function () {
            const { mastermind, codeMakerAddress, gameId, cc, nc } = await loadFixture(deployGuessedOnceAndElapsedAfkFixture);

            await expect(mastermind.connect(codeMakerAddress).publishFeedback(gameId, cc, nc))
                .to.be.revertedWith(
                    "Can't execute this function because the AFK dispute elapsed without a move"
                );
        });
    });

    describe("Reveal secret", function () {
        it("Should open the dispute phase after checking the validity of the secret revealed", async function () {
            const { mastermind, codeMakerAddress, secret, salt, gameId } = await loadFixture(deployCorrectGuessWithFeedbackFixture);

            await expect(mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt))
                .to.emit(mastermind, "DisputeAvailable")
                .withArgs(gameId);
        });

        it("Should send all the money to the CodeBreaker due to the dishonesty of the CodeMaker", async function () {
            const { mastermind, codeMakerAddress, codeBreakerAddress, wrongSecret, salt, gameId, twoEth } = await loadFixture(deployDishonestCodeMakerFixture);

            const response = await mastermind.connect(codeMakerAddress).revealSecret(gameId, wrongSecret, salt);

            await expect(response)
                .to.emit(mastermind, "PlayerDishonest")
                .withArgs(gameId, codeMakerAddress);
            
            await expect(response).to.changeEtherBalance(codeBreakerAddress, twoEth);

            expect(await mastermind.isGameFinished(gameId)).to.equal(true);
            expect(await mastermind.getWinner(gameId)).to.equal(codeBreakerAddress);
            expect(await mastermind.getFinalPrize(gameId)).to.equal(twoEth);
            expect(await mastermind.isGameTied(gameId)).to.be.equal(false);
        });

        it("Should fail because the provided gameId is not correct", async function () {
            const { mastermind, codeMakerAddress, secret, salt } = await loadFixture(deployCorrectGuessWithFeedbackFixture);

            await expect(mastermind.connect(codeMakerAddress).revealSecret(5, secret, salt))
                .to.be.revertedWith(
                    "Game not found"
                );
        });

        it("Should fail because the address is not authorized to interact with the game", async function () {
            const { mastermind, account3, secret, salt, gameId } = await loadFixture(deployCorrectGuessWithFeedbackFixture);

            await expect(mastermind.connect(account3).revealSecret(gameId, secret, salt))
                .to.be.revertedWith(
                    "Not authorized to interact with this game"
                );
        });

        it("Should fail because the game is finished", async function () {
            const { mastermind, account1, gameId, secret, salt } = await loadFixture(deployGameFinishedFixture);

            await expect(mastermind.connect(account1).revealSecret(gameId, secret, salt))
                .to.be.revertedWith(
                    "The game is finished"
                );
        });

        it("Should fail because the CodeBreaker can't reveal the secret", async function () {
            const { mastermind, codeBreakerAddress, secret, salt, gameId } = await loadFixture(deployCorrectGuessWithFeedbackFixture);

            await expect(mastermind.connect(codeBreakerAddress).revealSecret(gameId, secret, salt))
                .to.be.revertedWith(
                    "Can't reveal the secret as CodeBreaker"
                );
        });

        it("Should fail because the function is invoked before the CodeBreaker gives the first feedback", async function () {
            const { mastermind, codeMakerAddress, gameId, secret, salt } = await loadFixture(deployGuessedOnceFixture);

            await expect(mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt))
                .to.be.revertedWith(
                    "CodeMaker didn't give the feedback yet"
                );
        });

        it("Should fail because the function is invoked before the CodeBreaker break the code or finishes the guesses", async function () {
            const { mastermind, codeMakerAddress, gameId, secret, salt } = await loadFixture(deployFeedbackToNotCorrectGuessFixture);

            await expect(mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt))
                .to.be.revertedWith(
                    "Guesses from the CodeBreaker not finished yet"
                );
        });

        it("Should fail because the CodeMaker already revealed the secret", async function () {
            const { mastermind, codeMakerAddress, secret, salt, gameId } = await loadFixture(deployRevealSecretWithHonestCodeMakerFixture);

            await expect(mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt))
                .to.be.revertedWith(
                    "Secret already revealed"
                );
        });

        it("Should fail because the CodeMaker is revealing the secret after the Afk elapsed", async function () {
            const { mastermind, codeMakerAddress, gameId, secret, salt } = await loadFixture(deployCorrectGuessWithFeedbackAndElapsedTimeFixture);

            await expect(mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt))
                .to.be.revertedWith(
                    "Can't execute this function because the AFK dispute elapsed without a move"
                );
        });
    });

    describe("Dispute phase", async function () {
        it("Should send the prize to the CodeMaker because it was honest and the CodeBreaker didn't belive it", async function () {
            const { mastermind, codeBreakerAddress, codeMakerAddress, gameId, disputeIndex, twoEth } = await loadFixture(deployRevealSecretWithHonestCodeMakerFixture);

            const response = await mastermind.connect(codeBreakerAddress).startDispute(gameId, disputeIndex);

            await expect(response)
                .to.emit(mastermind, "DisputeOutcome")
                .withArgs(gameId, codeMakerAddress);

            await expect(response).to.changeEtherBalance(codeMakerAddress, twoEth);

            expect(await mastermind.isGameFinished(gameId)).to.equal(true);
            expect(await mastermind.getWinner(gameId)).to.equal(codeMakerAddress);
            expect(await mastermind.getFinalPrize(gameId)).to.equal(twoEth);
            expect(await mastermind.isGameTied(gameId)).to.be.equal(false);
        });

        it("Should send the prize to the CodeBreaker because the CodeMaker was dishonest in the fourth feedback", async function () {
            const { mastermind, codeBreakerAddress, gameId, disputeIndex, twoEth } = await loadFixture(deployRevealSecretWithDishonestCodeMakerFixture);

            const response = await mastermind.connect(codeBreakerAddress).startDispute(gameId, disputeIndex);

            await expect(response)
                .to.emit(mastermind, "DisputeOutcome")
                .withArgs(gameId, codeBreakerAddress);

            await expect(response).to.changeEtherBalance(codeBreakerAddress, twoEth);
            
            expect(await mastermind.isGameFinished(gameId)).to.equal(true);
            expect(await mastermind.getWinner(gameId)).to.equal(codeBreakerAddress);
            expect(await mastermind.getFinalPrize(gameId)).to.equal(twoEth);
            expect(await mastermind.isGameTied(gameId)).to.be.equal(false);
        });

        it("Should fail because the provided gameId doesn't exists", async function () {
            const { mastermind, codeBreakerAddress, disputeIndex } = await loadFixture(deployRevealSecretWithHonestCodeMakerFixture);

            await expect(mastermind.connect(codeBreakerAddress).startDispute(5, disputeIndex))
                .to.be.revertedWith(
                    "Game not found"
                );
        });

        it("Should fail because the account is not authorized to partecipate to the game", async function () {
            const { mastermind, account3, disputeIndex, gameId} = await loadFixture(deployRevealSecretWithHonestCodeMakerFixture);

            await expect(mastermind.connect(account3).startDispute(gameId, disputeIndex))
                .to.be.revertedWith(
                    "Not authorized to interact with this game"
                );
        });

        it("Should fail because the game is finished", async function () {
            const { mastermind, account1, gameId, disputeIndex } = await loadFixture(deployGameFinishedFixture);

            await expect(mastermind.connect(account1).startDispute(gameId, disputeIndex))
                .to.be.revertedWith(
                    "The game is finished"
                );
        });

        it("Should fail because the CodeMaker is trying to open a dispute", async function () {
            const { mastermind, codeMakerAddress, disputeIndex, gameId } = await loadFixture(deployRevealSecretWithHonestCodeMakerFixture);

            await expect(mastermind.connect(codeMakerAddress).startDispute(gameId, disputeIndex))
                .to.be.revertedWith(
                    "Can't open a dispute as CodeMaker"
                );
        });

        it("Should fail because the guess reference is not in the bound", async function () {
            const { mastermind, codeBreakerAddress, gameId } = await loadFixture(deployRevealSecretWithHonestCodeMakerFixture);

            await expect(mastermind.connect(codeBreakerAddress).startDispute(gameId, 10))
                .to.be.revertedWith(
                    "Guess reference must be less than 5"
                );
        });

        it("Should fail because the CodeMaker didn't published the secret yet", async function () {
            const { mastermind, codeBreakerAddress, gameId, guessReference } = await loadFixture(deploySecretNotRevealedYetFixture);

            await expect(mastermind.connect(codeBreakerAddress).startDispute(gameId, guessReference))
                .to.be.revertedWith(
                    "Secret code not published yet by the CodeMaker"
                );
        });

        it("Should fail because the guess reference is not present", async function () {
            const { mastermind, codeBreakerAddress, gameId, disputeIndex } = await loadFixture(deployRevealSecretWithLessGuessWithHonestCodeMakerFixture);

            await expect(mastermind.connect(codeBreakerAddress).startDispute(gameId, disputeIndex))
                .to.be.revertedWith(
                    "Invalid guess reference"
                );
        });

        it("Should fail because the dispute phase is elapsed", async function () {
            const { mastermind, codeBreakerAddress, gameId, disputeIndex } = await loadFixture(deployRevealSecretWithElapsedDisputeTimeFixture);

            await expect(mastermind.connect(codeBreakerAddress).startDispute(gameId, disputeIndex))
                .to.be.revertedWith(
                    "Dispute phase terminated"
                );
        });
    });

    describe("Change turn", function () {
        it("Should change turn after dispute time elapsed", async function () {
            const { mastermind, codeMakerAddress, codeBreakerAddress, gameId } = await loadFixture(deployRevealSecretWithElapsedDisputeTimeFixture);

            await expect(mastermind.connect(codeMakerAddress).changeTurn(gameId))
                .to.emit(mastermind, "NewTurn")
                .withArgs(gameId, codeBreakerAddress, codeMakerAddress);

            expect(await mastermind.getCurrentTurn(gameId)).to.equal(1);
            expect(await mastermind.getCurrentGuess(gameId)).to.equal(0);
        });

        it("Should end the game after the last turn, compute the final points and send the prize to the winner", async function () {
            const { mastermind, winner, codeBreakerAddress, gameId, twoEth } = await loadFixture(deployGameFinishedWithoutLastTurnChangeFixture);

            const response = await mastermind.connect(codeBreakerAddress).changeTurn(gameId);
            
            await expect(response)
                .to.emit(mastermind, "GameEnded")
                .withArgs(gameId, winner, twoEth);

            await expect(response).to.changeEtherBalance(winner, twoEth);

            expect(await mastermind.isGameFinished(gameId)).to.equal(true);
            expect(await mastermind.getWinner(gameId)).to.equal(winner);
            expect(await mastermind.getFinalPrize(gameId)).to.equal(twoEth);
            expect(await mastermind.isGameTied(gameId)).to.be.equal(false);
        });

        it("Should end the game after the last turn, compute the final points and send the bets to the owners due to the tie", async function () {
            const { mastermind, codeMakerAddress, codeBreakerAddress, gameId, oneEth, nullAddress } = await loadFixture(deployGameFinishedWithATieFixture);

            const response = await mastermind.connect(codeBreakerAddress).changeTurn(gameId);
            
            await expect(response)
                .to.emit(mastermind, "GameEndedWithTie")
                .withArgs(gameId);

            await expect(response).to.changeEtherBalances(
                [codeMakerAddress, codeBreakerAddress],
                [oneEth, oneEth]
                );

            expect(await mastermind.isGameFinished(gameId)).to.equal(true);
            expect(await mastermind.isGameTied(gameId)).to.equal(true);
            expect(await mastermind.getWinner(gameId)).to.equal(nullAddress);
            expect(await mastermind.getFinalPrize(gameId)).to.equal(oneEth);
        });

        it("Should fail because the provided gameId wasn't found", async function () {
            const { mastermind, codeMakerAddress } = await loadFixture(deployRevealSecretWithElapsedDisputeTimeFixture);

            await expect(mastermind.connect(codeMakerAddress).changeTurn(5))
                .to.revertedWith(
                    "Game not found"
                )
        });

        it("Should fail because the address is not authorized to interact with the game", async function () {
            const { mastermind, gameId, account3 } = await loadFixture(deployRevealSecretWithElapsedDisputeTimeFixture);

            await expect(mastermind.connect(account3).changeTurn(gameId))
                .to.revertedWith(
                    "Not authorized to interact with this game"
                );
        });

        it("Should fail because the game is finished", async function () {
            const { mastermind, account1, gameId } = await loadFixture(deployGameFinishedFixture);

            await expect(mastermind.connect(account1).changeTurn(gameId))
                .to.be.revertedWith(
                    "The game is finished"
                );
        });

        it("Should fail because the changeTurn function can't be invoked by the CodeBreaker", async function () {
            const { mastermind, gameId, codeBreakerAddress } = await loadFixture(deployRevealSecretWithElapsedDisputeTimeFixture);

            await expect(mastermind.connect(codeBreakerAddress).changeTurn(gameId))
                .to.revertedWith(
                    "Can't change turn as CodeBreaker"
                );
        });

        it("Should fail because the secret code is not yet published by the CodeMaker", async function () {
            const { mastermind, gameId, codeMakerAddress } = await loadFixture(deployPublishedSecretFixture);

            await expect(mastermind.connect(codeMakerAddress).changeTurn(gameId))
                .to.revertedWith(
                    "Secret code not published yet by the CodeMaker"
                );
        });

        it("Should fail because the dispute phase didn't elapse yet", async function () {
            const { mastermind, gameId, codeMakerAddress } = await loadFixture(deployRevealSecretWithHonestCodeMakerFixture);

            await expect(mastermind.connect(codeMakerAddress).changeTurn(gameId))
                .to.revertedWith(
                    "Dispute phase not terminated yet"
                );
        });

        it("Should fail because the CodeMaker is changing turn after the Afk elapsed", async function () {
            const { mastermind, gameId, codeMakerAddress } = await loadFixture(deployRevealSecretWithElapsedDisputeTimeAndAfkFixture);

            await expect(mastermind.connect(codeMakerAddress).changeTurn(gameId))
                .to.be.revertedWith(
                    "Can't execute this function because the AFK dispute elapsed without a move"
                );
        });
    });

    describe("Points computation", function () {
        it("Should add one point without extra", async function () {
            const { mastermind, codeMakerIndex, codeBreakerIndex, gameId } = await loadFixture(deployCorrectGuessedAtFirstTryFixture);
            
            expect(await mastermind.getPointsForPlayer(gameId, codeMakerIndex)).to.equal(1);
            expect(await mastermind.getPointsForPlayer(gameId, codeBreakerIndex)).to.equal(0);
        });

        it("Should add three points without extra", async function () {
            const { mastermind, codeMakerIndex, codeBreakerIndex, gameId } = await loadFixture(deployCorrectGuessedAfterThreeTryFixture);

            expect(await mastermind.getPointsForPlayer(gameId, codeMakerIndex)).to.equal(3);
            expect(await mastermind.getPointsForPlayer(gameId, codeBreakerIndex)).to.equal(0);
        });

        it("Should add five points with extra points", async function () {
            const { mastermind, codeMakerIndex, codeBreakerIndex, gameId } = await loadFixture(deployNotAbleToBreakCodeFixture);

            expect(await mastermind.getPointsForPlayer(gameId, codeMakerIndex)).to.equal(5 + 3);
            expect(await mastermind.getPointsForPlayer(gameId, codeBreakerIndex)).to.equal(0);
        });
    });

    describe("AFK", function () {
        describe("Emit AFK", function () {
            it("Should emit Afk when called during bet phase", async function () {
                const { mastermind, account1, gameId } = await loadFixture(deployFirstBetFixture);

                await expect(mastermind.connect(account1).emitAfk(gameId))
                    .to.emit(mastermind, "Afk")
                    .withArgs(gameId, account1);
            });

            it("Should emit Afk when called during publish secret phase", async function () {
                const { mastermind, codeBreakerAddress, gameId } = await loadFixture(deployAgreedBetFixture);

                await expect(mastermind.connect(codeBreakerAddress).emitAfk(gameId))
                    .to.emit(mastermind, "Afk")
                    .withArgs(gameId, codeBreakerAddress);
            });

            it("Should emit Afk when called during guessing phase", async function () {
                const { mastermind, codeMakerAddress, gameId } = await loadFixture(deployPublishedSecretFixture);

                await expect(mastermind.connect(codeMakerAddress).emitAfk(gameId))
                    .to.emit(mastermind, "Afk")
                    .withArgs(gameId, codeMakerAddress);
            });

            it("Should emit Afk when called during feedback phase", async function () {
                const { mastermind, codeBreakerAddress, gameId } = await loadFixture(deployGuessedOnceFixture);

                await expect(mastermind.connect(codeBreakerAddress).emitAfk(gameId))
                    .to.emit(mastermind, "Afk")
                    .withArgs(gameId, codeBreakerAddress);
            });

            it("Should emit Afk when called during reveal secret phase", async function () {
                const { mastermind, codeMakerAddress, gameId } = await loadFixture(deployCorrectGuessedAtFirstTryFixture);
                
                //The turn changed so the address associated with codeMakerAddress is now the codeBreaker
                await expect(mastermind.connect(codeMakerAddress).emitAfk(gameId))
                    .to.emit(mastermind, "Afk")
                    .withArgs(gameId, codeMakerAddress);
            });

            it("Should emit Afk when called during change turn phase", async function () {
                const { mastermind, codeBreakerAddress, gameId } = await loadFixture(deployRevealSecretWithElapsedDisputeTimeFixture);

                await expect(mastermind.connect(codeBreakerAddress).emitAfk(gameId))
                    .to.emit(mastermind, "Afk")
                    .withArgs(gameId, codeBreakerAddress);
            });

            it("Should fail because the provided gameId is not correct", async function () {
                const { mastermind, codeBreakerAddress } = await loadFixture(deployCorrectGuessWithFeedbackFixture);
    
                await expect(mastermind.connect(codeBreakerAddress).emitAfk(5))
                    .to.be.revertedWith(
                        "Game not found"
                    );
            });
    
            it("Should fail because the address is not authorized to interact with the game", async function () {
                const { mastermind, account3, gameId } = await loadFixture(deployCorrectGuessWithFeedbackFixture);
    
                await expect(mastermind.connect(account3).emitAfk(gameId))
                    .to.be.revertedWith(
                        "Not authorized to interact with this game"
                    );
            });

            it("Should fail because the game is finished", async function () {
                const { mastermind, account1, gameId } = await loadFixture(deployGameFinishedFixture);
    
                await expect(mastermind.connect(account1).emitAfk(gameId))
                    .to.be.revertedWith(
                        "The game is finished"
                    );
            });

            it("Should fail because the address is trying to invoke emitAfk during his turn", async function () {
                const { mastermind, codeMakerAddress, gameId } = await loadFixture(deployCorrectGuessWithFeedbackFixture);
    
                await expect(mastermind.connect(codeMakerAddress).emitAfk(gameId))
                    .to.be.revertedWith(
                        "Can't emit an AFK while it's your turn"
                    );
            });

            it("Should fail because the address is trying to invoke emitAfk after he already emitted an AFK", async function () {
                const { mastermind, account1, gameId } = await loadFixture(deployEmittedAfkFixture);
    
                await expect(mastermind.connect(account1).emitAfk(gameId))
                    .to.be.revertedWith(
                        "Can't emit an AFK while another one is already in progress"
                    );
            });

            it("Should fail because the address is trying to invoke emitAfk during the dispute phase", async function () {
                const { mastermind, codeBreakerAddress, gameId } = await loadFixture(deployRevealSecretWithHonestCodeMakerFixture);
    
                await expect(mastermind.connect(codeBreakerAddress).emitAfk(gameId))
                    .to.be.revertedWith(
                        "Can't emit AFK during the dispute phase"
                    );
            });
        });

        describe("Redeem AFK", function () {
            it("Should emit GameEndedDueToAfk after the player who emitted the AFK, redeems the prize", async function () {
                const { mastermind, account1, gameId, oneEth } = await loadFixture(deployEmittedAfkWithShortTimerFixture);

                const response = mastermind.connect(account1).redeemAfterAfk(gameId);
                await expect(response)
                    .to.emit(mastermind, "GameEndedDueToAfk")
                    .withArgs(gameId, account1, oneEth);

                await expect(response).to.changeEtherBalance(account1, oneEth);

                expect(await mastermind.isGameFinished(gameId)).to.equal(true);
                expect(await mastermind.getWinner(gameId)).to.equal(account1);
                expect(await mastermind.getFinalPrize(gameId)).to.equal(oneEth);
                expect(await mastermind.isGameTied(gameId)).to.be.equal(false);
        });

            it("Should fail because the opponent performed his move before the elapse of the AFK timer", async function () {
                const { mastermind, account1, gameId } = await loadFixture(deployEmittedAfkWithOpponentMoveFixture);
                
                await expect(mastermind.connect(account1).redeemAfterAfk(gameId))
                    .to.be.revertedWith(
                        "Afk not emitted"
                    );
            });

            it("Should fail because the provided gameId is not correct", async function () {
                const { mastermind, codeBreakerAddress } = await loadFixture(deployCorrectGuessWithFeedbackFixture);
    
                await expect(mastermind.connect(codeBreakerAddress).redeemAfterAfk(5))
                    .to.be.revertedWith(
                        "Game not found"
                    );
            });
    
            it("Should fail because the address is not authorized to interact with the game", async function () {
                const { mastermind, account3, gameId } = await loadFixture(deployCorrectGuessWithFeedbackFixture);
    
                await expect(mastermind.connect(account3).redeemAfterAfk(gameId))
                    .to.be.revertedWith(
                        "Not authorized to interact with this game"
                    );
            });

            it("Should fail because the game is finished", async function () {
                const { mastermind, account1, gameId } = await loadFixture(deployGameFinishedFixture);
    
                await expect(mastermind.connect(account1).redeemAfterAfk(gameId))
                    .to.be.revertedWith(
                        "The game is finished"
                    );
            });

            it("Should fail because the address is trying to invoke redeemAfterAfk during his turn", async function () {
                const { mastermind, account2, gameId } = await loadFixture(deployEmittedAfkWithShortTimerFixture);
    
                await expect(mastermind.connect(account2).redeemAfterAfk(gameId))
                    .to.be.revertedWith(
                        "Can't redeem an AFK while it's your turn"
                    );
            });

            it("Should fail because the address is trying to invoke redeemAfterAfk when no AFK was emitted", async function () {
                const { mastermind, codeBreakerAddress, gameId } = await loadFixture(deployCorrectGuessWithFeedbackFixture);
    
                await expect(mastermind.connect(codeBreakerAddress).redeemAfterAfk(gameId))
                    .to.be.revertedWith(
                        "Afk not emitted"
                    );
            });

            it("Should fail because the address is trying to invoke redeemAfterAfk while the AFK timer didn't elapse", async function () {
                const { mastermind, account1, gameId } = await loadFixture(deployEmittedAfkFixture);
    
                await expect(mastermind.connect(account1).redeemAfterAfk(gameId))
                    .to.be.revertedWith(
                        "Can't redeem an AFK while there is still time left"
                    );
            });
        });
    });
});
