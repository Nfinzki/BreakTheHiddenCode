// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "./PokerBettingProtocol.sol";

contract BreakTheHiddenCode {
    uint constant N = 5; //Length of the orderd sequence
    uint constant M = 9; //Number of possible colors
    uint constant K = 3; //Extra points to be rewarded
    uint constant NT = 4; //Number of turns
    uint constant NG = 5; //Number of guesses
    uint disputeWindow; //Duration of the dispute time in blocks

    struct Turn {
        bytes1[N][NG] guesses;
        uint[NG] correctColorPosition;
        uint[NG] notCorrectColorPosition;
    }

    /*  Variables declaration */
    uint256 private nextGameId;

    //address 0 contains the creator of the game
    //address 1 contains the player who joins the game
    //address 2 contains the invited player
    mapping(uint256 => address[3]) public games;

    uint256[] joinableGames;

    address[] connectedPlayers;

    PokerBettingProtocol pokerBetting;

    bytes1[] public ammissibleColors;

    mapping(uint256 => uint[2]) public points;
    mapping(uint256 => address[NT]) public codeMaker;
    mapping(uint256 => bytes32[NT]) public secretCodeHash;
    mapping(uint256 => bytes1[N][NT]) public secretCode;
    mapping(uint256 => string[NT]) public salt;
    mapping(uint256 => Turn[NT]) turns;
    mapping(uint256 => uint) currentTurn;
    mapping(uint256 => uint) currentGuess;
    mapping(uint256 => uint) disputeStart;

    /*  Events declaration */
    event GameCreated(uint gameId);
    event GameCreatedForAnOpponent(uint gameId, address opponent);
    event UserJoined(address opponent, uint gameId);
    event SecretPublished(uint gameId);
    event BettingPhaseStarted(uint gameId);
    event Check(uint gameId, uint totalBet, address bettingPlayerAddress);
    event Rise(uint gameId, uint betDifference, address bettingPlayerAddress);
    event Fold(uint gameId, address folderAddress);
    event Afk(uint gameId, address issuerAddress);
    event CodeMakerSelected(uint gameId, address codeMakerAddress);
    event GameEnded(uint gameId, address winner, uint prize);
    event Guess(uint gameId, bytes1[N] guess, uint turnNumber, uint guessNumber);
    event Feedback(uint gameId, uint cc, uint nc, uint turnNumber, uint guessNumber);
    event RevealSecret(uint gameId);
    event PlayerDishonest(uint gameId, address dishonest);
    event NewTurn(uint gameId, address codeMaker, address codeBreaker);
    event DisputeAvailable(uint gameId);
    event DisputeOutcome(uint gameId, address winner);

    /*  Constant utilities */
    uint32 constant gasLimit = 3000000;
    
    constructor(uint _disputeWindow) {
        nextGameId = 0;
        pokerBetting = new PokerBettingProtocol(address(this), 30 seconds);

        ammissibleColors.push('R'); //Red
        ammissibleColors.push('G'); //Green
        ammissibleColors.push('B'); //Blue
        ammissibleColors.push('W'); //White
        ammissibleColors.push('Y'); //Yellow
        ammissibleColors.push('P'); //Purple
        ammissibleColors.push('M'); //Magenta
        ammissibleColors.push('C'); //Cyan
        ammissibleColors.push('O'); //Orange

        require(ammissibleColors.length == M, "The number of colors doesn't match the provided colors");

        require(_disputeWindow > 0, "Dispute window length must be greater than zero");
        disputeWindow = _disputeWindow;
    }

    modifier validateGame(uint gameId) {
        require(games[gameId][0] != address(0) && games[gameId][1] != address(0), "Game not found");
        require(games[gameId][0] == msg.sender || games[gameId][1] == msg.sender, "Not authorized to interact with this game");
       
       _;
    }

    modifier validateGameForGuess(uint gameId, bytes1[] memory guess) {
        uint turnNumber = currentTurn[gameId];
        uint guessNumber = currentGuess[gameId];

        require(games[gameId][0] != address(0) && games[gameId][1] != address(0), "Game not found");
        require(games[gameId][0] == msg.sender || games[gameId][1] == msg.sender, "Not authorized to interact with this game");
        require(codeMaker[gameId][turnNumber] != msg.sender, "Can't guess as CodeMaker");
        require(secretCodeHash[gameId][turnNumber] != 0, "The secret is not yet published");
        require(guess.length == 5, "Code sequence length must be 5");
        require(validateColors(guess), "The colors provided are not valid");
        require(isBytesArrayEmpty(turns[gameId][turnNumber].guesses[guessNumber]), "Guess already submitted. Wait for a feedback by the CodeMaker");
        _;
    }

    modifier validateFeedback(uint gameId) {
        uint turnNumber = currentTurn[gameId];
        uint guessNumber = currentGuess[gameId];

        require(games[gameId][0] != address(0) && games[gameId][1] != address(0), "Game not found");
        require(games[gameId][0] == msg.sender || games[gameId][1] == msg.sender, "Not authorized to interact with this game");
        require(codeMaker[gameId][turnNumber] == msg.sender, "Can't give a feedback as CodeBreaker");
        require(!isBytesArrayEmpty(turns[gameId][turnNumber].guesses[guessNumber]), "Guess not submitted yet. Wait for a guess by the CodeBreaker");
        
        _;
    }

    modifier validateRevealSecret(uint gameId) {
        uint turnNumber = currentTurn[gameId];
        uint guessNumber = currentGuess[gameId];
        
        require(games[gameId][0] != address(0) && games[gameId][1] != address(0), "Game not found");
        require(games[gameId][0] == msg.sender || games[gameId][1] == msg.sender, "Not authorized to interact with this game");
        require(codeMaker[gameId][turnNumber] == msg.sender, "Can't reveal the secret as CodeBreaker");
        require(guessNumber > 0, "CodeMaker didn't give the feedback yet");
        require(turns[gameId][turnNumber].correctColorPosition[guessNumber - 1] == N || (!isBytesArrayEmpty(turns[gameId][turnNumber].guesses[NG - 1]) && currentGuess[gameId] == NG), "Guesses from the CodeBreaker not finished yet");

        _;
    }

    modifier validateDispute(uint gameId, uint guessReference) {
        uint turnNumber = currentTurn[gameId];
        uint guessNumber = currentGuess[gameId];
        
        require(games[gameId][0] != address(0) && games[gameId][1] != address(0), "Game not found");
        require(games[gameId][0] == msg.sender || games[gameId][1] == msg.sender, "Not authorized to interact with this game");
        require(codeMaker[gameId][turnNumber] != msg.sender, "Can't open a dispute ad CodeMaker");
        require(guessReference < NG, "Guess reference must be less than 5");
        require(!isBytesArrayEmpty(secretCode[gameId][turnNumber]), "Secret code not published yet by the CodeMaker");
        require(!isBytesArrayEmpty(turns[gameId][turnNumber].guesses[guessReference]), "Invalid guess reference");
        require(block.number < disputeStart[gameId] + disputeWindow, "Dispute phase terminated");

        _;
    }

    function createGame() external {
        require(!isPlayerPresent(msg.sender), "This address is already conneted to a game");

        games[nextGameId][0] = msg.sender;
        joinableGames.push(nextGameId);
        nextGameId++;

        connectedPlayers.push(msg.sender);

        emit GameCreated(nextGameId - 1);
    }

    function createGame(address opponentAddress) external {
        require(!isPlayerPresent(msg.sender), "This address is already conneted to a game");
        require(opponentAddress != address(0), "Invalid opponent address");
        require(msg.sender != opponentAddress, "Can't create a game with yourself");
    
        games[nextGameId][0] = msg.sender;
        games[nextGameId][2] = opponentAddress;
        nextGameId++;

        connectedPlayers.push(msg.sender);

        emit GameCreatedForAnOpponent(nextGameId - 1, opponentAddress);
    }

    function joinGame() external {
        require(!isPlayerPresent(msg.sender), "This address is already conneted to a game");
        require(nextGameId > 0, "Currently there are no existing games");
        require(joinableGames.length > 0, "There are no games to join");
        
        uint index = getRandom(joinableGames.length);
        uint gameId = joinableGames[index];

        removeJoinableGame(index);

        games[gameId][1] = msg.sender;

        connectedPlayers.push(msg.sender);

        emit UserJoined(msg.sender, gameId);

        pokerBetting.newBetting(games[gameId][0], games[gameId][1], gameId);
    }

    function joinGameById(uint gameId) external {
        require(nextGameId > 0, "Currently there are no existing games");
        require(games[gameId][0] != address(0), "Game doesn't exists");
        require(games[gameId][2] == msg.sender, "Not authorized to join the game");

        games[gameId][1] = msg.sender;
        games[gameId][2] = address(0);

        connectedPlayers.push(msg.sender);

        emit UserJoined(msg.sender, gameId);

        pokerBetting.newBetting(games[gameId][0], games[gameId][1], gameId);
    }

    function bet(uint gameId) payable external validateGame(gameId) {
        (bool success, bytes memory data) = address(pokerBetting).call{value: msg.value, gas: gasLimit}(
            abi.encodeWithSignature("bet(uint256,address)", gameId, msg.sender)
            );

        requireSuccess(success, data);

        (bool checked, uint betValue) = abi.decode(data, (bool, uint));

        if (checked) {
            emit Check(gameId, betValue, msg.sender);

            uint turnNumber = currentTurn[gameId];

            uint selectedCodeMaker = getRandom(2);
            codeMaker[gameId][turnNumber] = games[gameId][selectedCodeMaker];
            currentTurn[gameId] = 0;
            currentGuess[gameId] = 0;
            emit CodeMakerSelected(gameId, codeMaker[gameId][turnNumber]);
        } else
            emit Rise(gameId, betValue, msg.sender);
    }

    function fold(uint gameId) external validateGame(gameId) {
        pokerBetting.fold(gameId, msg.sender);

        removeConnectedPlayer(games[gameId][0]);
        removeConnectedPlayer(games[gameId][1]);
        games[gameId][0] = address(0);
        games[gameId][1] = address(0);

        emit Fold(gameId, msg.sender);
    }

    function issueAfk(uint gameId) external validateGame(gameId) {
        pokerBetting.issueAfk(gameId, msg.sender);

        removeConnectedPlayer(games[gameId][0]);
        removeConnectedPlayer(games[gameId][1]);
        games[gameId][0] = address(0);
        games[gameId][1] = address(0);

        emit Afk(gameId, msg.sender);
    }

    function withdraw(uint gameId, address winnerAddress) internal validateGame(gameId) {
        //TODO Add a require to check that the game finished
        uint prize = pokerBetting.withdraw(gameId, payable(winnerAddress));

        emit GameEnded(gameId, winnerAddress, prize);
    }

    function publishSecret(uint gameId, bytes32 secret) external validateGame(gameId) {
        require(pokerBetting.isBetFinished(gameId), "Bet is not finished yet");
        
        uint turnNumber = currentTurn[gameId];
        require(codeMaker[gameId][turnNumber] == msg.sender, "Not the CodeMaker");

        secretCodeHash[gameId][turnNumber] = secret;

        emit SecretPublished(gameId);
    }

    function tryGuess(uint gameId, bytes1[] memory guess) external validateGameForGuess(gameId, guess) {
        uint turnNumber = currentTurn[gameId];
        uint guessNumber = currentGuess[gameId];
        bytes1[N] memory fixedSizeGuess = convertToFixedLength(guess);

        turns[gameId][turnNumber].guesses[guessNumber] = fixedSizeGuess;
        emit Guess(gameId, fixedSizeGuess, turnNumber, guessNumber);
    }

    function publishFeedback(uint gameId, uint cc, uint nc) external validateFeedback(gameId) {
        uint turnNumber = currentTurn[gameId];
        uint guessNumber = currentGuess[gameId];

        turns[gameId][turnNumber].correctColorPosition[guessNumber] = cc;
        turns[gameId][turnNumber].notCorrectColorPosition[guessNumber] = nc;

        currentGuess[gameId]++;

        if (cc == N) {
            addPoints(gameId, false); //Move after the dispute window
            emit RevealSecret(gameId);

            return;
        }

        if (currentGuess[gameId] == NG) {
            addPoints(gameId, true); //Move after the dispute window
            emit RevealSecret(gameId);

            return;
        }

        emit Feedback(gameId, cc, nc, turnNumber, guessNumber);
    }

    function revealSecret(uint gameId, bytes1[] memory guess, string memory _salt) external validateRevealSecret(gameId) {
        uint turnNumber = currentTurn[gameId];
        address codeBrekerAddress = getCodeBreakerAddress(gameId, msg.sender);
        bytes1[N] memory fixedSizeGuess = convertToFixedLength(guess);

        salt[gameId][turnNumber] = _salt;
        secretCode[gameId][turnNumber] = fixedSizeGuess;

        bytes32 computedSecret = concatenateAndHash(guess, _salt);

        if (computedSecret != secretCodeHash[gameId][turnNumber]) {
            pokerBetting.withdraw(gameId, payable(codeBrekerAddress));

            emit PlayerDishonest(gameId, msg.sender);

            //TODO Game termination
        }

        disputeStart[gameId] = block.number;
        emit DisputeAvailable(gameId);
    }

    function startDispute(uint gameId, uint guessReference) external validateDispute(gameId, guessReference) {
        uint turnNumber = currentTurn[gameId];

        bytes1[N] memory guess = turns[gameId][turnNumber].guesses[guessReference];
        uint cc = turns[gameId][turnNumber].correctColorPosition[guessReference];
        uint nc = turns[gameId][turnNumber].notCorrectColorPosition[guessReference];
        bytes1[N] memory code = secretCode[gameId][turnNumber];

        address payable disputeWinner;

        if (isCcEqual(code, guess, cc) && isNcEqual(code, guess, nc)) {
            disputeWinner = payable(codeMaker[gameId][turnNumber]);
        } else {
            disputeWinner = payable(msg.sender);
        }

        pokerBetting.withdraw(gameId, disputeWinner);
        emit DisputeOutcome(gameId, disputeWinner);

        //TODO Game termination
    }

    function changeTurn(uint gameId) internal {
        //TODO Implement
    }
        //TODO All of this goes after the dispute windows and the points computation
        // if (gameFinished) {
        //
        // }

        // Move to the next turn
        // currentTurn[gameId]++;
        // currentGuess[gameId] = 0;
        // codeMaker[gameId][currentTurn[gameId]] = codeBrekerAddress;
        // emit NewTurn(gameId, codeBrekerAddress, msg.sender);

        //TODO Implement: dispute window, move to next round, check if game terminated

    function addPoints(uint gameId, bool extraPoints) internal {
        uint awardedPoints = currentGuess[gameId];
        uint turnNumber = currentTurn[gameId];

        if (extraPoints)
            awardedPoints += K;
        
        uint index = getCodeMakerIndex(gameId, codeMaker[gameId][turnNumber]);

        points[gameId][index] += awardedPoints;
    }

    function getCodeMakerIndex(uint index, address codeMakerAddress) internal view returns(uint) {
        if (games[index][0] == codeMakerAddress)
            return 0;
        
        if (games[index][1] == codeMakerAddress)
            return 1;

        revert("Invalid CodeMaker address");
    }

    function getCodeBreakerAddress(uint index, address codeMakerAddress) internal view returns(address) {
        if (games[index][0] == codeMakerAddress)
            return games[index][1];
        
        if (games[index][1] == codeMakerAddress)
            return games[index][0];

        revert("Invalid CodeMaker address");
    }

    function getRandom(uint upperBound) internal view returns (uint) {
        bytes32 bhash = blockhash(block.number-1);
        bytes memory bytesArray = new bytes(32);
        for (uint i = 0; i < 32; i++) {
            bytesArray[i] = bhash[i];
        }
        uint rand = uint(keccak256(bytesArray));

        return rand % upperBound;
    }

    function removeJoinableGame(uint index) internal {
        joinableGames[index] = joinableGames[joinableGames.length - 1];
        joinableGames.pop();
    }

    function removeConnectedPlayer(address player) internal {
        for(uint i = 0; i < connectedPlayers.length; i++) {
            if (connectedPlayers[i] == player) {
                connectedPlayers[i] = connectedPlayers[connectedPlayers.length - 1];
                connectedPlayers.pop();
            }
        }
    }

    function isPlayerPresent(address player) internal view returns(bool) {
        for (uint i = 0; i < connectedPlayers.length; i++) {
            if (connectedPlayers[i] == player)
                return true;
        }

        return false;
    }

    function requireSuccess(bool success, bytes memory data) internal pure {
        if (!success) {
            // Decode the revert reason and revert with it
            if (data.length > 0) {
                assembly {
                    let returndata_size := mload(data)
                    revert(add(32, data), returndata_size)
                }
            } else {
                revert("Bet failed without a revert reason");
            }
        }
    }

    function validateColors(bytes1[] memory colors) internal view returns(bool) {
        for(uint i = 0; i < colors.length; i++) {
            if (!findColor(colors[i]))
                return false;
        }

        return true;
    }

    function findColor(bytes1 color) internal view returns(bool) {
        for(uint i = 0; i < ammissibleColors.length; i++) {
            if (color == ammissibleColors[i])
                return true;
        }

        return false;
    }

    function convertToFixedLength(bytes1[] memory guess) internal pure returns (bytes1[N] memory) {
        bytes1[N] memory fixedSizeGuess;
        for (uint i = 0; i < guess.length; i++) {
            fixedSizeGuess[i] = guess[i];
        }
        return fixedSizeGuess;
    }

    function isBytesArrayEmpty(bytes1[N] memory array) internal pure returns (bool) {
        for (uint i = 0; i < array.length; i++) {
            if (array[i] != 0x00) {
                return false;
            }
        }
        return true;
    }

    function concatenateAndHash(bytes1[] memory guess, string memory _salt) public pure returns (bytes32) {
        bytes memory concatenated = abi.encodePacked(guessToBytes(guess), bytes(_salt));
        return keccak256(concatenated);
    }

    function guessToBytes(bytes1[] memory guess) internal pure returns (bytes memory) {
        bytes memory result = new bytes(guess.length);
        for (uint i = 0; i < guess.length; i++) {
            result[i] = guess[i];
        }
        return result;
    }

    function isCcEqual(bytes1[N] memory secret, bytes1[N] memory guess, uint cc) internal pure returns(bool) {
        uint computedCc = 0;

        for (uint i = 0; i < N; i++)
            if (secret[i] == guess[i])
                computedCc++;
        
        return cc == computedCc;
    }

    function isNcEqual(bytes1[N] memory secret, bytes1[N] memory guess, uint nc) internal pure returns (bool) {
        uint256[256] memory count1;
        uint256[256] memory count2;
        uint256 notCorrectlyPlaced = 0;

        //Counts the occurrency of each byte when they are not equal in position i
        for (uint256 i = 0; i < N; i++) {
            if (secret[i] != guess[i]) {
                count1[uint8(secret[i])]++;
                count2[uint8(guess[i])]++;
            }
        }

        for (uint256 i = 0; i < 256; i++) {
            if (count1[i] > 0) { // The secret contains a color not correctly guessed
                notCorrectlyPlaced += count2[i] < count1[i] ? count2[i] : count1[i];
            }
        }

        return nc == notCorrectlyPlaced;
    }
}