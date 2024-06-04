import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getPlayersRole, getBytesColors } from "./MastermindUtils";

describe("Mastermind", function () {
    async function deployContractFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const disputeWindow = 1;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");
        const fourEth = hre.ethers.parseEther("4");
        const fiftyEth = hre.ethers.parseEther("50");

        return { mastermind, nullAddress, account1, account2, account3, account4, oneEth, twoEth, fourEth, fiftyEth };
    }

    async function deployContractWithLargerDisputeWindowFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 10;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");
        const fiftyEth = hre.ethers.parseEther("50");

        return { mastermind, nullAddress, account1, account2, account3, account4, oneEth, twoEth, fiftyEth };
    }

    async function deployContractWithShorterAfkWindowFixture() {
        const [account1, account2, account3, account4] = await hre.ethers.getSigners();

        const disputeWindow = 10;
        const afkWindow = 1;

        const Mastermind = await hre.ethers.getContractFactory("Mastermind");
        const mastermind = await Mastermind.deploy(disputeWindow, afkWindow);

        const nullAddress = "0x0000000000000000000000000000000000000000";

        const oneEth = hre.ethers.parseEther("1");
        const twoEth = hre.ethers.parseEther("2");
        const fiftyEth = hre.ethers.parseEther("50");

        return { mastermind, nullAddress, account1, account2, account3, account4, oneEth, twoEth, fiftyEth };
    }

    async function rise(mastermind: any, gameId: any, account1: any, eth: any, expectedEth: any) {
        await expect(mastermind.connect(account1).bet(gameId, { "value": eth }))
            .to.emit(mastermind, "Rise")
            .withArgs(gameId, expectedEth, account1);
    }

    async function publishSecret(mastermind: any, gameId: any, codeMakerAddress: any, codeBreakerAddress: any, secret: any, salt: any) {
        let firstGameSecretHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(secret + salt));

        await expect(mastermind.connect(codeMakerAddress).publishSecret(gameId, firstGameSecretHash))
            .to.emit(mastermind, "SecretPublished")
            .withArgs(gameId, firstGameSecretHash);
    }

    async function tryGuess(mastermind: any, gameId: any, codeBreakerAddress: any, turnNumber: any, guessNumber: any, guess: any) {
        let bytesColors = getBytesColors(guess);
        await expect(mastermind.connect(codeBreakerAddress).tryGuess(gameId, bytesColors))
            .to.emit(mastermind, "Guess")
            .withArgs(gameId, bytesColors, turnNumber, guessNumber);
    }

    async function feedback(mastermind: any, gameId: any, codeMakerAddress: any, turnNumber: any, guessNumber: any, cc: any, nc: any) {
        await expect(mastermind.connect(codeMakerAddress).publishFeedback(gameId, cc, nc))
            .to.emit(mastermind, "Feedback")
            .withArgs(gameId, cc, nc, turnNumber, guessNumber);
    }

    async function revealSecret(mastermind: any, gameId: any, codeMakerAddress: any, secret: any, salt: any) {
        await expect(mastermind.connect(codeMakerAddress).revealSecret(gameId, secret, salt))
            .to.emit(mastermind, "DisputeAvailable")
            .withArgs(gameId);
    }

    async function changeTurn(mastermind: any, gameId: any, codeMakerAddress: any, codeBreakerAddress: any) {
        await expect(mastermind.connect(codeMakerAddress).changeTurn(gameId))
            .to.emit(mastermind, "NewTurn")
            .withArgs(gameId, codeBreakerAddress, codeMakerAddress);
    }

    describe("Scenario 1", function () {
        it("Scenario 1 - A couple of honest games where the players agree on the prize after a couple of bets and they guess correctly at the first try or after a couple of tries. One of the player fails to correctly guess the code", async function () {
            const { mastermind, account1, account2, account3, account4, oneEth, twoEth, fourEth } = await loadFixture(deployContractFixture);

            /*      Game creation      */
            const firstGameId = 0;
            const secondGameId = 1;

            await expect(mastermind.connect(account1)["createGame()"]())
                .to.emit(mastermind, "GameCreated")
                .withArgs(firstGameId);

            await expect(mastermind.connect(account3)["createGame(address)"](account4))
                .to.emit(mastermind, "GameCreatedForAnOpponent")
                .withArgs(secondGameId, account4);


            /*      Join game      */
            await expect(mastermind.connect(account2).joinGame())
                .to.emit(mastermind, "UserJoined")
                .withArgs(account2, firstGameId);

            await expect(mastermind.connect(account4).joinGameById(secondGameId))
                .to.emit(mastermind, "UserJoined")
                .withArgs(account4, secondGameId);


            /*      Betting phase      */
            await rise(mastermind, firstGameId, account1, oneEth, oneEth);

            await rise(mastermind, secondGameId, account3, oneEth, oneEth);

            //First game: Check
            let firstGameResponse = mastermind.connect(account2).bet(firstGameId, { "value": oneEth });

            await expect(firstGameResponse)
                .to.emit(mastermind, "Check")
                .withArgs(firstGameId, twoEth, account2);

            let turnNumberGame1 = 0;
            let guessNumberGame1 = 0;
            let codeMakerGame1 = await mastermind.getCodeMaker(firstGameId, turnNumberGame1);

            await expect(firstGameResponse)
                .to.emit(mastermind, "CodeMakerSelected")
                .withArgs(firstGameId, codeMakerGame1);

            //Second game: Rise and then Check
            await rise(mastermind, secondGameId, account4, twoEth, oneEth);

            let secondGameResponse = mastermind.connect(account3).bet(secondGameId, { "value": oneEth });

            await expect(secondGameResponse)
                .to.emit(mastermind, "Check")
                .withArgs(secondGameId, fourEth, account3);

            let turnNumberGame2 = 0;
            let guessNumberGame2 = 0;
            let codeMakerGame2 = await mastermind.getCodeMaker(secondGameId, turnNumberGame2);

            await expect(secondGameResponse)
                .to.emit(mastermind, "CodeMakerSelected")
                .withArgs(secondGameId, codeMakerGame2);


            /*      Publish Secret phase - Turn 1      */
            const salt = "V3ryL0ngS4ltV4lu3";
            let { codeMakerAddress: codeMakerAddressGame1, codeBreakerAddress: codeBreakerAddressGame1 } = getPlayersRole(account1, account2, codeMakerGame1);
            await publishSecret(mastermind, firstGameId, codeMakerAddressGame1, codeBreakerAddressGame1, "RGBRG", salt);


            let { codeMakerAddress: codeMakerAddressGame2, codeBreakerAddress: codeBreakerAddressGame2 } = getPlayersRole(account3, account4, codeMakerGame2);
            await publishSecret(mastermind, secondGameId, codeMakerAddressGame2, codeBreakerAddressGame2, "GGOWB", salt);


            /*      Guessing phase - Turn 1      */
            //First guess
            await tryGuess(mastermind, firstGameId, codeBreakerAddressGame1, turnNumberGame1, guessNumberGame1, ['B', 'R', 'Y', 'G', 'G']);

            await tryGuess(mastermind, secondGameId, codeBreakerAddressGame2, turnNumberGame2, guessNumberGame2, ['G', 'O', 'W', 'Y', 'B']);


            //First feedback
            await feedback(mastermind, firstGameId, codeMakerAddressGame1, turnNumberGame1, guessNumberGame1, 1, 2); //One color in the correct position, two correct colors in the wrong position
            guessNumberGame1++;

            await feedback(mastermind, secondGameId, codeMakerAddressGame2, turnNumberGame2, guessNumberGame2, 2, 2); //Two colors in the correct position, two correct colors in the wrong position
            guessNumberGame2++;

            //Second guess
            await tryGuess(mastermind, firstGameId, codeBreakerAddressGame1, turnNumberGame1, guessNumberGame1, ['Y', 'Y', 'R', 'G', 'R']);

            await tryGuess(mastermind, secondGameId, codeBreakerAddressGame2, turnNumberGame2, guessNumberGame2, ['G', 'W', 'O', 'G', 'B']);

            //Second feedback
            await feedback(mastermind, firstGameId, codeMakerAddressGame1, turnNumberGame1, guessNumberGame1, 0, 3); //No color in the correct position, three correct colors in the wrong position
            guessNumberGame1++;

            await feedback(mastermind, secondGameId, codeMakerAddressGame2, turnNumberGame2, guessNumberGame2, 2, 3); //Two colors in the correct position, three correct colors in the wrong position
            guessNumberGame2++;

            //Third guess
            await tryGuess(mastermind, firstGameId, codeBreakerAddressGame1, turnNumberGame1, guessNumberGame1, ['R', 'Y', 'O', 'W', 'G']);

            await tryGuess(mastermind, secondGameId, codeBreakerAddressGame2, turnNumberGame2, guessNumberGame2, ['G', 'O', 'G', 'W', 'B']);

            //Third feedback
            await feedback(mastermind, firstGameId, codeMakerAddressGame1, turnNumberGame1, guessNumberGame1, 2, 0); //Two colors in the correct position, zero correct colors in the wrong position
            guessNumberGame1++;

            await feedback(mastermind, secondGameId, codeMakerAddressGame2, turnNumberGame2, guessNumberGame2, 3, 2); //Three colors in the correct position, two correct colors in the wrong position
            guessNumberGame2++;

            //Fourth guess
            await tryGuess(mastermind, firstGameId, codeBreakerAddressGame1, turnNumberGame1, guessNumberGame1, ['R', 'B', 'R', 'G', 'G']);

            await tryGuess(mastermind, secondGameId, codeBreakerAddressGame2, turnNumberGame2, guessNumberGame2, ['G', 'G', 'O', 'W', 'B']);

            //Fourth feedback
            await feedback(mastermind, firstGameId, codeMakerAddressGame1, turnNumberGame1, guessNumberGame1, 2, 3); //Two colors in the correct position, three correct colors in the wrong position
            guessNumberGame1++;

            await expect(mastermind.connect(codeMakerAddressGame2).publishFeedback(secondGameId, 5, 0)) //Code correctly guessed
                .to.emit(mastermind, "RevealSecret")
                .withArgs(secondGameId);
            guessNumberGame2++;

            //Fifth guess
            await tryGuess(mastermind, firstGameId, codeBreakerAddressGame1, turnNumberGame1, guessNumberGame1, ['R', 'R', 'B', 'G', 'G']);

            //Fifth feedback
            await expect(mastermind.connect(codeMakerAddressGame1).publishFeedback(firstGameId, 3, 2)) //Code not guessed
                .to.emit(mastermind, "RevealSecret")
                .withArgs(firstGameId);
            guessNumberGame1++;


            /*      Reveal secret phase - Turn 1      */
            await revealSecret(mastermind, firstGameId, codeMakerAddressGame1, getBytesColors(['R', 'G', 'B', 'R', 'G']), salt);

            await revealSecret(mastermind, secondGameId, codeMakerAddressGame2, getBytesColors(['G', 'G', 'O', 'W', 'B']), salt);


            /*      Change turn phase - Turn 1      */
            await changeTurn(mastermind, firstGameId, codeMakerAddressGame1, codeBreakerAddressGame1);
            turnNumberGame1++;
            guessNumberGame1 = 0;

            codeMakerGame1 = await mastermind.getCodeMaker(firstGameId, turnNumberGame1);
            let codeMakerIndexGame1, codeBreakerIndexGame1;
            ({ codeMakerAddress: codeMakerAddressGame1, codeBreakerAddress: codeBreakerAddressGame1, codeMakerIndex: codeMakerIndexGame1, codeBreakerIndex: codeBreakerIndexGame1 } = getPlayersRole(account1, account2, codeMakerGame1));

            expect(await mastermind.getPointsForPlayer(firstGameId, codeBreakerIndexGame1)).to.equal(8); //The actual CodeBreaker is the previous CodeMaker that obtainted the points
            expect(await mastermind.getPointsForPlayer(firstGameId, codeMakerIndexGame1)).to.equal(0); //The actual CodeMaker is the previous CodeBreaker and didn't obtain points


            await changeTurn(mastermind, secondGameId, codeMakerAddressGame2, codeBreakerAddressGame2);
            turnNumberGame2++;
            guessNumberGame2 = 0;

            codeMakerGame2 = await mastermind.getCodeMaker(secondGameId, turnNumberGame2);
            let codeMakerIndexGame2, codeBreakerIndexGame2;
            ({ codeMakerAddress: codeMakerAddressGame2, codeBreakerAddress: codeBreakerAddressGame2, codeMakerIndex: codeMakerIndexGame2, codeBreakerIndex: codeBreakerIndexGame2 } = getPlayersRole(account3, account4, codeMakerGame2));

            expect(await mastermind.getPointsForPlayer(secondGameId, codeBreakerIndexGame2)).to.equal(4); //The actual CodeBreaker is the previous CodeMaker that obtainted the points
            expect(await mastermind.getPointsForPlayer(secondGameId, codeMakerIndexGame2)).to.equal(0); //The actual CodeMaker is the previous CodeBreaker and didn't obtain points


            /*      Publish Secret phase - Turn 2      */
            ({ codeMakerAddress: codeMakerAddressGame1, codeBreakerAddress: codeBreakerAddressGame1 } = getPlayersRole(account1, account2, codeMakerGame1));

            publishSecret(mastermind, firstGameId, codeMakerAddressGame1, codeBreakerAddressGame1, "WPOBR", salt);


            ({ codeMakerAddress: codeMakerAddressGame2, codeBreakerAddress: codeBreakerAddressGame2 } = getPlayersRole(account3, account4, codeMakerGame2));
            publishSecret(mastermind, secondGameId, codeMakerAddressGame2, codeBreakerAddressGame2, "MOCGR", salt);


            /*      Guessing phase - Turn 2      */
            //First guess
            await expect(mastermind.connect(codeMakerAddressGame1).emitAfk(firstGameId)) //Emits an Afk to the CodeBreaker of the first game
                .to.emit(mastermind, "Afk")
                .withArgs(firstGameId, codeMakerAddressGame1);

            await tryGuess(mastermind, firstGameId, codeBreakerAddressGame1, turnNumberGame1, guessNumberGame1, ['C', 'R', 'P', 'W', 'G']);

            await tryGuess(mastermind, secondGameId, codeBreakerAddressGame2, turnNumberGame2, guessNumberGame2, ['M', 'O', 'C', 'G', 'R']);


            //First feedback
            await feedback(mastermind, firstGameId, codeMakerAddressGame1, turnNumberGame1, guessNumberGame1, 0, 3); //Zero color in the correct position, three correct colors in the wrong position
            guessNumberGame1++;

            await expect(mastermind.connect(codeMakerAddressGame2).publishFeedback(secondGameId, 5, 0)) //Code correctly guessed
                .to.emit(mastermind, "RevealSecret")
                .withArgs(secondGameId);
            guessNumberGame2++;

            //Second guess
            await tryGuess(mastermind, firstGameId, codeBreakerAddressGame1, turnNumberGame1, guessNumberGame1, ['W', 'P', 'O', 'W', 'G']);

            //Second feedback
            await feedback(mastermind, firstGameId, codeMakerAddressGame1, turnNumberGame1, guessNumberGame1, 3, 0); //Three colors in the correct position, zero correct color in the wrong position
            guessNumberGame1++;

            //Third guess
            await tryGuess(mastermind, firstGameId, codeBreakerAddressGame1, turnNumberGame1, guessNumberGame1, ['W', 'P', 'O', 'B', 'R']);

            //Third feedback
            await expect(mastermind.connect(codeMakerAddressGame1).publishFeedback(firstGameId, 5, 0)) //Code correctly guessed
                .to.emit(mastermind, "RevealSecret")
                .withArgs(firstGameId);
            guessNumberGame1++;


            /*      Reveal secret phase - Turn 2      */
            await revealSecret(mastermind, firstGameId, codeMakerAddressGame1, getBytesColors(['W', 'P', 'O', 'B', 'R']), salt);

            await revealSecret(mastermind, secondGameId, codeMakerAddressGame2, getBytesColors(['M', 'O', 'C', 'G', 'R']), salt);


            /*      Change turn phase - Turn 2      */
            await changeTurn(mastermind, firstGameId, codeMakerAddressGame1, codeBreakerAddressGame1);
            turnNumberGame1++;
            guessNumberGame1 = 0;

            codeMakerGame1 = await mastermind.getCodeMaker(firstGameId, turnNumberGame1);
            ({ codeMakerAddress: codeMakerAddressGame1, codeBreakerAddress: codeBreakerAddressGame1, codeMakerIndex: codeMakerIndexGame1, codeBreakerIndex: codeBreakerIndexGame1 } = getPlayersRole(account1, account2, codeMakerGame1));

            expect(await mastermind.getPointsForPlayer(firstGameId, codeBreakerIndexGame1)).to.equal(3); //The actual CodeBreaker is the previous CodeMaker that obtainted the points
            expect(await mastermind.getPointsForPlayer(firstGameId, codeMakerIndexGame1)).to.equal(8); //The actual CodeMaker is the previous CodeBreaker


            await changeTurn(mastermind, secondGameId, codeMakerAddressGame2, codeBreakerAddressGame2);
            turnNumberGame2++;
            guessNumberGame2 = 0;

            codeMakerGame2 = await mastermind.getCodeMaker(secondGameId, turnNumberGame2);
            ({ codeMakerAddress: codeMakerAddressGame2, codeBreakerAddress: codeBreakerAddressGame2, codeMakerIndex: codeMakerIndexGame2, codeBreakerIndex: codeBreakerIndexGame2 } = getPlayersRole(account3, account4, codeMakerGame2));

            expect(await mastermind.getPointsForPlayer(secondGameId, codeBreakerIndexGame2)).to.equal(1); //The actual CodeBreaker is the previous CodeMaker that obtainted the points
            expect(await mastermind.getPointsForPlayer(secondGameId, codeMakerIndexGame2)).to.equal(4); //The actual CodeMaker is the previous CodeBreaker


            /*      Publish Secret phase - Turn 3      */
            ({ codeMakerAddress: codeMakerAddressGame1, codeBreakerAddress: codeBreakerAddressGame1 } = getPlayersRole(account1, account2, codeMakerGame1));

            publishSecret(mastermind, firstGameId, codeMakerAddressGame1, codeBreakerAddressGame1, "ROOCY", salt);


            ({ codeMakerAddress: codeMakerAddressGame2, codeBreakerAddress: codeBreakerAddressGame2 } = getPlayersRole(account3, account4, codeMakerGame2));
            publishSecret(mastermind, secondGameId, codeMakerAddressGame2, codeBreakerAddressGame2, "COMPY", salt);


            /*      Guessing phase - Turn 3      */
            //First guess
            await tryGuess(mastermind, firstGameId, codeBreakerAddressGame1, turnNumberGame1, guessNumberGame1, ['R', 'O', 'O', 'C', 'Y']);

            await tryGuess(mastermind, secondGameId, codeBreakerAddressGame2, turnNumberGame2, guessNumberGame2, ['C', 'O', 'M', 'P', 'Y']);


            //First feedback
            await expect(mastermind.connect(codeBreakerAddressGame2).emitAfk(secondGameId)) //Emits an Afk to the CodeMaker of the second game
                .to.emit(mastermind, "Afk")
                .withArgs(secondGameId, codeBreakerAddressGame2);

            await expect(mastermind.connect(codeMakerAddressGame1).publishFeedback(firstGameId, 5, 0)) //Code correctly guessed
                .to.emit(mastermind, "RevealSecret")
                .withArgs(firstGameId);
            guessNumberGame1++;

            await expect(mastermind.connect(codeMakerAddressGame2).publishFeedback(secondGameId, 5, 0)) //Code correctly guessed
                .to.emit(mastermind, "RevealSecret")
                .withArgs(secondGameId);
            guessNumberGame2++;


            /*      Reveal secret phase - Turn 3      */
            await revealSecret(mastermind, firstGameId, codeMakerAddressGame1, getBytesColors(['R', 'O', 'O', 'C', 'Y']), salt);

            await revealSecret(mastermind, secondGameId, codeMakerAddressGame2, getBytesColors(['C', 'O', 'M', 'P', 'Y']), salt);


            /*      Change turn phase - Turn 3      */
            await changeTurn(mastermind, firstGameId, codeMakerAddressGame1, codeBreakerAddressGame1);
            turnNumberGame1++;
            guessNumberGame1 = 0;

            codeMakerGame1 = await mastermind.getCodeMaker(firstGameId, turnNumberGame1);
            ({ codeMakerAddress: codeMakerAddressGame1, codeBreakerAddress: codeBreakerAddressGame1, codeMakerIndex: codeMakerIndexGame1, codeBreakerIndex: codeBreakerIndexGame1 } = getPlayersRole(account1, account2, codeMakerGame1));

            expect(await mastermind.getPointsForPlayer(firstGameId, codeBreakerIndexGame1)).to.equal(9); //The actual CodeBreaker is the previous CodeMaker that obtainted the points
            expect(await mastermind.getPointsForPlayer(firstGameId, codeMakerIndexGame1)).to.equal(3); //The actual CodeMaker is the previous CodeBreaker


            await changeTurn(mastermind, secondGameId, codeMakerAddressGame2, codeBreakerAddressGame2);
            turnNumberGame2++;
            guessNumberGame2 = 0;

            codeMakerGame2 = await mastermind.getCodeMaker(secondGameId, turnNumberGame2);
            ({ codeMakerAddress: codeMakerAddressGame2, codeBreakerAddress: codeBreakerAddressGame2, codeMakerIndex: codeMakerIndexGame2, codeBreakerIndex: codeBreakerIndexGame2 } = getPlayersRole(account3, account4, codeMakerGame2));

            expect(await mastermind.getPointsForPlayer(secondGameId, codeBreakerIndexGame2)).to.equal(5); //The actual CodeBreaker is the previous CodeMaker that obtainted the points
            expect(await mastermind.getPointsForPlayer(secondGameId, codeMakerIndexGame2)).to.equal(1); //The actual CodeMaker is the previous CodeBreaker


            /*      Publish Secret phase - Turn 4      */
            await expect(mastermind.connect(codeBreakerAddressGame2).emitAfk(secondGameId)) //Emits an Afk to the CodeMaker of the second game
                .to.emit(mastermind, "Afk")
                .withArgs(secondGameId, codeBreakerAddressGame2);

            ({ codeMakerAddress: codeMakerAddressGame1, codeBreakerAddress: codeBreakerAddressGame1 } = getPlayersRole(account1, account2, codeMakerGame1));
            publishSecret(mastermind, firstGameId, codeMakerAddressGame1, codeBreakerAddressGame1, "COCCY", salt);


            ({ codeMakerAddress: codeMakerAddressGame2, codeBreakerAddress: codeBreakerAddressGame2 } = getPlayersRole(account3, account4, codeMakerGame2));
            publishSecret(mastermind, secondGameId, codeMakerAddressGame2, codeBreakerAddressGame2, "YOWMY", salt);


            /*      Guessing phase - Turn 4      */
            //First guess
            await tryGuess(mastermind, firstGameId, codeBreakerAddressGame1, turnNumberGame1, guessNumberGame1, ['C', 'O', 'C', 'C', 'Y']);

            await tryGuess(mastermind, secondGameId, codeBreakerAddressGame2, turnNumberGame2, guessNumberGame2, ['Y', 'O', 'O', 'O', 'O']);

            //First feedback
            await expect(mastermind.connect(codeMakerAddressGame1).publishFeedback(firstGameId, 5, 0)) //Code correctly guessed
                .to.emit(mastermind, "RevealSecret")
                .withArgs(firstGameId);
            guessNumberGame1++;

            await feedback(mastermind, secondGameId, codeMakerAddressGame2, turnNumberGame2, guessNumberGame2, 2, 0);
            guessNumberGame2++;

            //Second guess
            await tryGuess(mastermind, secondGameId, codeBreakerAddressGame2, turnNumberGame2, guessNumberGame2, ['Y', 'O', 'W', 'C', 'G']);

            //Second feedback
            await feedback(mastermind, secondGameId, codeMakerAddressGame2, turnNumberGame2, guessNumberGame2, 3, 0);
            guessNumberGame2++;

            //Third guess
            await tryGuess(mastermind, secondGameId, codeBreakerAddressGame2, turnNumberGame2, guessNumberGame2, ['Y', 'O', 'W', 'M', 'P']);

            //Third feedback
            await feedback(mastermind, secondGameId, codeMakerAddressGame2, turnNumberGame2, guessNumberGame2, 4, 0);
            guessNumberGame2++;

            //Fourth guess
            await tryGuess(mastermind, secondGameId, codeBreakerAddressGame2, turnNumberGame2, guessNumberGame2, ['Y', 'O', 'W', 'M', 'Y']);

            //Fourth feedback
            await expect(mastermind.connect(codeMakerAddressGame2).publishFeedback(secondGameId, 5, 0)) //Code correctly guessed
                .to.emit(mastermind, "RevealSecret")
                .withArgs(secondGameId);
            guessNumberGame2++;


            /*      Reveal secret phase - Turn 4      */
            await revealSecret(mastermind, firstGameId, codeMakerAddressGame1, getBytesColors(['C', 'O', 'C', 'C', 'Y']), salt);

            await revealSecret(mastermind, secondGameId, codeMakerAddressGame2, getBytesColors(['Y', 'O', 'W', 'M', 'Y']), salt);


            /*      Change turn phase - Turn 4      */
            firstGameResponse = mastermind.connect(codeMakerAddressGame1).changeTurn(firstGameId);
            await expect(firstGameResponse)
                .to.emit(mastermind, "GameEnded")
                .withArgs(firstGameId, codeBreakerAddressGame1, twoEth);

            expect(await mastermind.getPointsForPlayer(firstGameId, codeMakerIndexGame1)).to.equal(4);
            expect(await mastermind.getPointsForPlayer(firstGameId, codeBreakerIndexGame1)).to.equal(9);
            await expect(firstGameResponse).to.changeEtherBalance(codeBreakerAddressGame1, twoEth);
            expect(await mastermind.getGameEndingReason(firstGameId)).to.be.equal("Game ended");


            await expect(mastermind.connect(codeMakerAddressGame2).changeTurn(secondGameId))
                .to.emit(mastermind, "GameEndedWithTie")
                .withArgs(secondGameId);

            expect(await mastermind.getPointsForPlayer(secondGameId, codeMakerIndexGame2)).to.equal(5);
            expect(await mastermind.getPointsForPlayer(secondGameId, codeBreakerIndexGame2)).to.equal(5);
            await expect(firstGameResponse).to.changeEtherBalance(codeBreakerAddressGame1, twoEth);
            expect(await mastermind.getGameEndingReason(secondGameId)).to.equal("Game ended");
        });

        it("Scenario 2 - One of the two players fold during the betting because the bet is too high", async function () {
            const { mastermind, account1, account2, oneEth, twoEth, fiftyEth } = await loadFixture(deployContractFixture);

            /*      Game creation      */
            const gameId = 0;

            await expect(mastermind.connect(account1)["createGame()"]())
                .to.emit(mastermind, "GameCreated")
                .withArgs(gameId);


            /*      Join game      */
            await expect(mastermind.connect(account2).joinGame())
                .to.emit(mastermind, "UserJoined")
                .withArgs(account2, gameId);


            /*      Betting phase      */
            await rise(mastermind, gameId, account1, oneEth, oneEth);

            await rise(mastermind, gameId, account2, twoEth, oneEth);

            await rise(mastermind, gameId, account1, fiftyEth, fiftyEth - oneEth);

            const response = mastermind.connect(account2).fold(gameId);
            await expect(response)
                .to.emit(mastermind, "Fold")
                .withArgs(gameId, account2);

            await expect(response).to.changeEtherBalances(
                [account1, account2],
                [oneEth + fiftyEth, twoEth]
            );

            expect(await mastermind.getGameEndingReason(gameId)).to.be.equal("Fold");
        });

        it("Scenario 3 - The CodeMaker turns out to be dishonest and publishes the wrong secret", async function () {
            const { mastermind, account1, account2, oneEth, twoEth } = await loadFixture(deployContractFixture);

            /*      Game creation      */
            const gameId = 0;

            await expect(mastermind.connect(account1)["createGame()"]())
                .to.emit(mastermind, "GameCreated")
                .withArgs(gameId);


            /*      Join game      */
            await expect(mastermind.connect(account2).joinGame())
                .to.emit(mastermind, "UserJoined")
                .withArgs(account2, gameId);


            /*      Betting phase      */
            await rise(mastermind, gameId, account1, oneEth, oneEth);

            //First game: Check
            let firstGameResponse = mastermind.connect(account2).bet(gameId, { "value": oneEth });

            await expect(firstGameResponse)
                .to.emit(mastermind, "Check")
                .withArgs(gameId, twoEth, account2);

            let turnNumber = 0;
            let guessNumber = 0;
            let codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);

            await expect(firstGameResponse)
                .to.emit(mastermind, "CodeMakerSelected")
                .withArgs(gameId, codeMaker);


            /*      Publish Secret phase - Turn 1      */
            const salt = "V3ryL0ngS4ltV4lu3";
            let { codeMakerAddress, codeBreakerAddress } = getPlayersRole(account1, account2, codeMaker);
            await publishSecret(mastermind, gameId, codeMakerAddress, codeBreakerAddress, "RGBRG", salt);


            /*      Guessing phase - Turn 1      */
            //First guess
            await tryGuess(mastermind, gameId, codeBreakerAddress, turnNumber, guessNumber, ['R', 'G', 'B', 'R', 'G']);

            //First feedback
            await expect(mastermind.connect(codeMakerAddress).publishFeedback(gameId, 5, 0)) //Code guessed
                .to.emit(mastermind, "RevealSecret")
                .withArgs(gameId);
            guessNumber++;


            /*      Reveal secret phase - Turn 1      */
            const response = mastermind.connect(codeMakerAddress).revealSecret(gameId, getBytesColors(['W', 'Y', 'B', 'G', 'B']), salt);
            await expect(response)
                .to.emit(mastermind, "PlayerDishonest")
                .withArgs(gameId, codeMakerAddress);

            await expect(response).to.changeEtherBalance(codeBreakerAddress, twoEth);
            expect(await mastermind.getGameEndingReason(gameId)).to.be.equal("Invalid secret revealed");
        });

        it("Scenario 4 - The CodeMaker turns out to be dishonest because gives wrong feedbacks to mislead the CodeBreaker", async function () {
            const { mastermind, account1, account2, oneEth, twoEth, fiftyEth } = await loadFixture(deployContractFixture);

            /*      Game creation      */
            const gameId = 0;

            await expect(mastermind.connect(account1)["createGame()"]())
                .to.emit(mastermind, "GameCreated")
                .withArgs(gameId);


            /*      Join game      */
            await expect(mastermind.connect(account2).joinGame())
                .to.emit(mastermind, "UserJoined")
                .withArgs(account2, gameId);


            /*      Betting phase      */
            await rise(mastermind, gameId, account1, oneEth, oneEth);

            await rise(mastermind, gameId, account2, twoEth, oneEth);

            await rise(mastermind, gameId, account1, fiftyEth, fiftyEth - oneEth);

            const response = mastermind.connect(account2).fold(gameId);
            await expect(response)
                .to.emit(mastermind, "Fold")
                .withArgs(gameId, account2);

            await expect(response).to.changeEtherBalances(
                [account1, account2],
                [oneEth + fiftyEth, twoEth]
            );

            expect(await mastermind.getGameEndingReason(gameId)).to.be.equal("Fold");
        });

        it("Scenario 5 - The CodeMaker turns out to be dishonest and publishes the wrong secret", async function () {
            const { mastermind, account1, account2, oneEth, twoEth } = await loadFixture(deployContractWithLargerDisputeWindowFixture);

            /*      Game creation      */
            const gameId = 0;

            await expect(mastermind.connect(account1)["createGame()"]())
                .to.emit(mastermind, "GameCreated")
                .withArgs(gameId);


            /*      Join game      */
            await expect(mastermind.connect(account2).joinGame())
                .to.emit(mastermind, "UserJoined")
                .withArgs(account2, gameId);


            /*      Betting phase      */
            await rise(mastermind, gameId, account1, oneEth, oneEth);

            //First game: Check
            let firstGameResponse = mastermind.connect(account2).bet(gameId, { "value": oneEth });

            await expect(firstGameResponse)
                .to.emit(mastermind, "Check")
                .withArgs(gameId, twoEth, account2);

            let turnNumber = 0;
            let guessNumber = 0;
            let codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);

            await expect(firstGameResponse)
                .to.emit(mastermind, "CodeMakerSelected")
                .withArgs(gameId, codeMaker);


            /*      Publish Secret phase - Turn 1      */
            const salt = "V3ryL0ngS4ltV4lu3";
            let { codeMakerAddress, codeBreakerAddress } = getPlayersRole(account1, account2, codeMaker);
            await publishSecret(mastermind, gameId, codeMakerAddress, codeBreakerAddress, "RGBRG", salt);


            /*      Guessing phase - Turn 1      */
            //First guess
            await tryGuess(mastermind, gameId, codeBreakerAddress, turnNumber, guessNumber, ['R', 'B', 'O', 'W', 'Y']);

            //First feedback
            await feedback(mastermind, gameId, codeMakerAddress, turnNumber, guessNumber, 1, 1);
            guessNumber++;

            //Second guess
            await tryGuess(mastermind, gameId, codeBreakerAddress, turnNumber, guessNumber, ['R', 'G', 'O', 'R', 'B']);

            //Second feedback
            await feedback(mastermind, gameId, codeMakerAddress, turnNumber, guessNumber, 3, 1);
            guessNumber++;

            //Third guess
            await tryGuess(mastermind, gameId, codeBreakerAddress, turnNumber, guessNumber, ['R', 'G', 'B', 'R', 'G']);

            //Third feedback
            await feedback(mastermind, gameId, codeMakerAddress, turnNumber, guessNumber, 4, 0); //This is the dishonest feedback
            guessNumber++;

            //Fourth guess
            await tryGuess(mastermind, gameId, codeBreakerAddress, turnNumber, guessNumber, ['R', 'G', 'B', 'R', 'C']);

            //Fourth feedback
            await feedback(mastermind, gameId, codeMakerAddress, turnNumber, guessNumber, 4, 0);
            guessNumber++;

            //Fifth guess
            await tryGuess(mastermind, gameId, codeBreakerAddress, turnNumber, guessNumber, ['R', 'G', 'B', 'R', 'P']);

            //Fifth feedback
            await expect(mastermind.connect(codeMakerAddress).publishFeedback(gameId, 4, 0))
                .to.emit(mastermind, "RevealSecret")
                .withArgs(gameId);
            guessNumber++;


            /*      Reveal secret phase - Turn 1      */
            await expect(mastermind.connect(codeMakerAddress).revealSecret(gameId, getBytesColors(['R', 'G', 'B', 'R', 'G']), salt))
                .to.emit(mastermind, "DisputeAvailable")
                .withArgs(gameId);


            /*      Dispute phase       */
            const response = mastermind.connect(codeBreakerAddress).startDispute(gameId, 2);
            await expect(response)
                .to.emit(mastermind, "DisputeOutcome")
                .withArgs(gameId, codeBreakerAddress);

            await expect(response).to.changeEtherBalance(codeBreakerAddress, twoEth);
            expect(await mastermind.getGameEndingReason(gameId)).to.be.equal("Dispute");
        });

        it("Scenario 6 - The CodeBreaker doesn't provide a new guess for too long and the CodeMaker emits an Afk that elapse", async function () {
            const { mastermind, account1, account2, account3, account4, oneEth, twoEth } = await loadFixture(deployContractWithShorterAfkWindowFixture);

            /*      Game creation      */
            const gameId = 0;
            const secondGameId = 1;

            await expect(mastermind.connect(account1)["createGame()"]())
                .to.emit(mastermind, "GameCreated")
                .withArgs(gameId);


            /*      Join game      */
            await expect(mastermind.connect(account2).joinGame())
                .to.emit(mastermind, "UserJoined")
                .withArgs(account2, gameId);


            /*      Betting phase      */
            await rise(mastermind, gameId, account1, oneEth, oneEth);

            //First game: Check
            let firstGameResponse = mastermind.connect(account2).bet(gameId, { "value": oneEth });

            await expect(firstGameResponse)
                .to.emit(mastermind, "Check")
                .withArgs(gameId, twoEth, account2);

            let turnNumber = 0;
            let guessNumber = 0;
            let codeMaker = await mastermind.getCodeMaker(gameId, turnNumber);

            await expect(firstGameResponse)
                .to.emit(mastermind, "CodeMakerSelected")
                .withArgs(gameId, codeMaker);


            /*      Publish Secret phase - Turn 1      */
            const salt = "V3ryL0ngS4ltV4lu3";
            let { codeMakerAddress, codeBreakerAddress } = getPlayersRole(account1, account2, codeMaker);
            await publishSecret(mastermind, gameId, codeMakerAddress, codeBreakerAddress, "RGBRG", salt);


            /*      Guessing phase - Turn 1      */
            //First guess
            await tryGuess(mastermind, gameId, codeBreakerAddress, turnNumber, guessNumber, ['R', 'B', 'O', 'W', 'Y']);

            //First feedback
            await feedback(mastermind, gameId, codeMakerAddress, turnNumber, guessNumber, 1, 1);
            guessNumber++;

            //Second guess
            await tryGuess(mastermind, gameId, codeBreakerAddress, turnNumber, guessNumber, ['R', 'G', 'O', 'R', 'B']);

            //Second feedback
            await feedback(mastermind, gameId, codeMakerAddress, turnNumber, guessNumber, 3, 1);
            guessNumber++;

            
            /*      Emit Afk       */
            await expect(mastermind.connect(codeMakerAddress).emitAfk(gameId))
                .to.emit(mastermind, "Afk")
                .withArgs(gameId, codeMakerAddress);
                
            // Operation to make the Afk elapse
            await expect(mastermind.connect(account3)["createGame(address)"](account4))
                .to.emit(mastermind, "GameCreatedForAnOpponent")
                .withArgs(secondGameId, account4);

            
            /*      Redeem Afk      */
            const response = await mastermind.connect(codeMakerAddress).redeemAfterAfk(gameId);

            await expect(response)
                .to.emit(mastermind, "GameEndedDueToAfk")
                .withArgs(gameId, codeMakerAddress, twoEth);

            await expect(response).to.changeEtherBalance(codeMakerAddress, twoEth);
            expect(await mastermind.getGameEndingReason(gameId)).to.be.equal("Afk redeemed");

            //Quit the other game because no one is joining
            await expect(mastermind.connect(account3).quitGame(secondGameId))
                .to.emit(mastermind, "Disconnected")
                .withArgs(account3);
               
            expect(await mastermind.getGameEndingReason(secondGameId)).to.equal("No player joined");
        });
    });
});