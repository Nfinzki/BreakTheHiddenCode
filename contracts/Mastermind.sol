// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "./PokerBettingProtocol.sol";

contract Mastermind {
    uint constant N = 5; //Length of the orderd sequence
    uint constant M = 9; //Number of possible colors
    uint constant K = 3; //Extra points to be rewarded
    uint constant NT = 4; //Number of turns
    uint constant NG = 5; //Number of guesses
    uint disputeWindow; //Duration of the dispute time in blocks
    uint afkWindow; //Duration of the afk deadline in blocks

    struct Turn {
        bytes1[N][NG] guesses;
        uint[NG] correctColorPosition;
        uint[NG] notCorrectColorPosition;
    }

    struct Player {
        address addr;
        uint points;
    }

    struct Game {
        Player[2] players;
        address invitedPlayer;
        address[NT] codeMaker;
        bytes32[NT] secretCodeHash;
        bytes1[N][NT] secretCode;
        string[NT] salt;
        Turn[NT] turns;
        uint currentTurn;
        uint currentGuess;
        uint disputeStart;
        bool[NT] isCodeGuessed;
        uint afkStart;
        address nextMoveTo;
        bool gameFinished;
        address winner;
        bool isGameTied;
        uint finalPrize;
    }

    /*  Variables declaration */
    uint256 private nextGameId;

    uint256[] joinableGames;

    address[] connectedPlayers;

    PokerBettingProtocol pokerBetting;

    bytes1[] public ammissibleColors;

    mapping(uint256 => Game) games;

    /*  Events declaration */
    event GameCreated(uint gameId);
    event GameCreatedForAnOpponent(uint gameId, address opponent);
    event UserJoined(address opponent, uint gameId);
    event SecretPublished(uint gameId, bytes32 secret);
    event BettingPhaseStarted(uint gameId);
    event Check(uint gameId, uint totalBet, address bettingPlayerAddress);
    event Rise(uint gameId, uint betDifference, address bettingPlayerAddress);
    event Fold(uint gameId, address folderAddress);
    event Afk(uint gameId, address issuerAddress);
    event CodeMakerSelected(uint gameId, address codeMakerAddress);
    event GameEnded(uint gameId, address winner, uint prize);
    event GameEndedDueToAfk(uint gameId, address winner, uint prize);
    event Guess(uint gameId, bytes1[N] guess, uint turnNumber, uint guessNumber);
    event Feedback(uint gameId, uint cc, uint nc, uint turnNumber, uint guessNumber);
    event RevealSecret(uint gameId);
    event PlayerDishonest(uint gameId, address dishonest);
    event NewTurn(uint gameId, address codeMaker, address codeBreaker);
    event DisputeAvailable(uint gameId);
    event DisputeOutcome(uint gameId, address winner);
    event GameEndedWithTie(uint gameId);
    event Disconnected(address player);

    /*  Constant utilities */
    uint32 constant gasLimit = 3000000;
    
    constructor(uint _disputeWindow, uint _afkWindow) {
        nextGameId = 0;
        pokerBetting = new PokerBettingProtocol(address(this));

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

        require(_afkWindow > 0, "AFK window length must be greater than zero");
        afkWindow = _afkWindow;
    }

    modifier validateGame(uint gameId) {
        require(games[gameId].players[0].addr != address(0) && games[gameId].players[1].addr != address(0), "Game not found");
        require(games[gameId].players[0].addr == msg.sender || games[gameId].players[1].addr == msg.sender, "Not authorized to interact with this game");
        require(!games[gameId].gameFinished, "The game is finished");
        
        if (games[gameId].afkStart > 0)
            require(games[gameId].afkStart + afkWindow > block.number, "Can't execute this function because the AFK dispute elapsed without a move");
       
       _;
    }

    modifier validateGameForGuess(uint gameId, bytes1[] memory guess) {
        uint turnNumber = games[gameId].currentTurn;
        uint guessNumber = games[gameId].currentGuess;

        require(games[gameId].players[0].addr != address(0) && games[gameId].players[1].addr != address(0), "Game not found");
        require(games[gameId].players[0].addr == msg.sender || games[gameId].players[1].addr == msg.sender, "Not authorized to interact with this game");
        require(!games[gameId].gameFinished, "The game is finished");
        require(games[gameId].codeMaker[turnNumber] != msg.sender, "Can't guess as CodeMaker");
        require(games[gameId].secretCodeHash[turnNumber] != 0, "The secret is not yet published");
        require(guess.length == 5, "Code sequence length must be 5");
        require(validateColors(guess), "The colors provided are not valid");
        require(isBytesArrayEmpty(games[gameId].turns[turnNumber].guesses[guessNumber]), "Guess already submitted. Wait for a feedback by the CodeMaker");
        
        if (games[gameId].afkStart > 0)
            require(games[gameId].afkStart + afkWindow > block.number, "Can't execute this function because the AFK dispute elapsed without a move");
        
        _;
    }

    modifier validateFeedback(uint gameId) {
        uint turnNumber = games[gameId].currentTurn;
        uint guessNumber = games[gameId].currentGuess;

        require(games[gameId].players[0].addr != address(0) && games[gameId].players[1].addr != address(0), "Game not found");
        require(games[gameId].players[0].addr == msg.sender || games[gameId].players[1].addr == msg.sender, "Not authorized to interact with this game");
        require(!games[gameId].gameFinished, "The game is finished");
        require(games[gameId].codeMaker[turnNumber] == msg.sender, "Can't give a feedback as CodeBreaker");
        require(!isBytesArrayEmpty(games[gameId].turns[turnNumber].guesses[guessNumber]), "Guess not submitted yet. Wait for a guess by the CodeBreaker");
        
        if (games[gameId].afkStart > 0)
            require(games[gameId].afkStart + afkWindow > block.number, "Can't execute this function because the AFK dispute elapsed without a move");
        
        _;
    }

    modifier validateRevealSecret(uint gameId) {
        uint turnNumber = games[gameId].currentTurn;
        uint guessNumber = games[gameId].currentGuess;
        
        require(games[gameId].players[0].addr != address(0) && games[gameId].players[1].addr != address(0), "Game not found");
        require(games[gameId].players[0].addr == msg.sender || games[gameId].players[1].addr == msg.sender, "Not authorized to interact with this game");
        require(!games[gameId].gameFinished, "The game is finished");
        require(games[gameId].codeMaker[turnNumber] == msg.sender, "Can't reveal the secret as CodeBreaker");
        require(guessNumber > 0, "CodeMaker didn't give the feedback yet");
        require(games[gameId].turns[turnNumber].correctColorPosition[guessNumber - 1] == N || (!isBytesArrayEmpty(games[gameId].turns[turnNumber].guesses[NG - 1]) && games[gameId].currentGuess == NG), "Guesses from the CodeBreaker not finished yet");
        require(isBytesArrayEmpty(games[gameId].secretCode[turnNumber]), "Secret already revealed");
        
        if (games[gameId].afkStart > 0)
            require(games[gameId].afkStart + afkWindow > block.number, "Can't execute this function because the AFK dispute elapsed without a move");

        _;
    }

    modifier validateDispute(uint gameId, uint guessReference) {
        uint turnNumber = games[gameId].currentTurn;
        uint guessNumber = games[gameId].currentGuess;
        
        require(games[gameId].players[0].addr != address(0) && games[gameId].players[1].addr != address(0), "Game not found");
        require(games[gameId].players[0].addr == msg.sender || games[gameId].players[1].addr == msg.sender, "Not authorized to interact with this game");
        require(!games[gameId].gameFinished, "The game is finished");
        require(games[gameId].codeMaker[turnNumber] != msg.sender, "Can't open a dispute as CodeMaker");
        require(guessReference < NG, "Guess reference must be less than 5");
        require(!isBytesArrayEmpty(games[gameId].secretCode[turnNumber]), "Secret code not published yet by the CodeMaker");
        require(!isBytesArrayEmpty(games[gameId].turns[turnNumber].guesses[guessReference]), "Invalid guess reference");
        require(block.number < games[gameId].disputeStart + disputeWindow, "Dispute phase terminated");

        _;
    }

    modifier validateChangeTurn(uint gameId) {
        uint turnNumber = games[gameId].currentTurn;

        require(games[gameId].players[0].addr != address(0) && games[gameId].players[1].addr != address(0), "Game not found");
        require(games[gameId].players[0].addr == msg.sender || games[gameId].players[1].addr == msg.sender, "Not authorized to interact with this game");
        require(!games[gameId].gameFinished, "The game is finished");
        require(games[gameId].codeMaker[turnNumber] == msg.sender, "Can't change turn as CodeBreaker");
        require(!isBytesArrayEmpty(games[gameId].secretCode[turnNumber]), "Secret code not published yet by the CodeMaker");
        require(block.number > games[gameId].disputeStart + disputeWindow, "Dispute phase not terminated yet");
        
        if (games[gameId].afkStart > 0)
            require(games[gameId].afkStart + afkWindow > block.number, "Can't execute this function because the AFK dispute elapsed without a move");

        _;
    }

    modifier validateEmitAfk(uint gameId) {
        require(games[gameId].players[0].addr != address(0) && games[gameId].players[1].addr != address(0), "Game not found");
        require(games[gameId].players[0].addr == msg.sender || games[gameId].players[1].addr == msg.sender, "Not authorized to interact with this game");
        require(!games[gameId].gameFinished, "The game is finished");
        require(games[gameId].nextMoveTo != msg.sender, "Can't emit an AFK while it's your turn");
        require(games[gameId].afkStart == 0, "Can't emit an AFK while another one is already in progress");
        require(block.number > games[gameId].disputeStart + disputeWindow, "Can't emit AFK during the dispute phase");

        _;
    }

    modifier validateRedeemAfterAfk(uint gameId) {
        require(games[gameId].players[0].addr != address(0) && games[gameId].players[1].addr != address(0), "Game not found");
        require(games[gameId].players[0].addr == msg.sender || games[gameId].players[1].addr == msg.sender, "Not authorized to interact with this game");
        require(!games[gameId].gameFinished, "The game is finished");
        require(games[gameId].afkStart > 0, "Afk not emitted");
        require(games[gameId].nextMoveTo != msg.sender, "Can't redeem an AFK while it's your turn");
        require(games[gameId].afkStart + afkWindow < block.number, "Can't redeem an AFK while there is still time left");

        _;
    }

    function createGame() external {
        require(!isPlayerPresent(msg.sender), "This address is already conneted to a game");

        games[nextGameId].players[0].addr = msg.sender;
        joinableGames.push(nextGameId);
        nextGameId++;

        connectedPlayers.push(msg.sender);

        emit GameCreated(nextGameId - 1);
    }

    function createGame(address opponentAddress) external {
        require(!isPlayerPresent(msg.sender), "This address is already conneted to a game");
        require(opponentAddress != address(0), "Invalid opponent address");
        require(msg.sender != opponentAddress, "Can't create a game with yourself");
    
        games[nextGameId].players[0].addr = msg.sender;
        games[nextGameId].invitedPlayer = opponentAddress;
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

        games[gameId].players[1].addr = msg.sender;

        connectedPlayers.push(msg.sender);

        emit UserJoined(msg.sender, gameId);

        pokerBetting.newBetting(games[gameId].players[0].addr, games[gameId].players[1].addr, gameId);
        games[gameId].nextMoveTo = games[gameId].players[0].addr;
    }

    function joinGameById(uint gameId) external {
        require(nextGameId > 0, "Currently there are no existing games");
        require(games[gameId].players[0].addr != address(0), "Game doesn't exists");
        require(games[gameId].invitedPlayer == msg.sender, "Not authorized to join the game");

        games[gameId].players[1].addr = msg.sender;
        games[gameId].invitedPlayer = address(0);

        connectedPlayers.push(msg.sender);

        emit UserJoined(msg.sender, gameId);

        pokerBetting.newBetting(games[gameId].players[0].addr, games[gameId].players[1].addr, gameId);
        games[gameId].nextMoveTo = games[gameId].players[0].addr;
    }

    function quitGame(uint gameId) external {
        require(nextGameId > 0, "Currently there are no existing games");
        require(games[gameId].players[0].addr == msg.sender, "The provided gameId is not associated to the address");
        require(games[gameId].players[1].addr == address(0), "The game started");

        if (games[gameId].invitedPlayer == address(0))
            removeJoinableGame(gameId);

        removeConnectedPlayer(games[gameId].players[0].addr);

        emit Disconnected(msg.sender);        
    }

    function bet(uint gameId) payable external validateGame(gameId) {
        games[gameId].afkStart = 0;

        (bool success, bytes memory data) = address(pokerBetting).call{value: msg.value, gas: gasLimit}(
            abi.encodeWithSignature("bet(uint256,address)", gameId, msg.sender)
            );

        requireSuccess(success, data);

        (bool checked, uint betValue) = abi.decode(data, (bool, uint));

        if (checked) {
            emit Check(gameId, betValue, msg.sender);

            uint turnNumber = games[gameId].currentTurn;

            uint selectedCodeMaker = getRandom(2);
            games[gameId].codeMaker[turnNumber] = games[gameId].players[selectedCodeMaker].addr;
            games[gameId].currentTurn = 0;
            games[gameId].currentGuess = 0;
            games[gameId].nextMoveTo = games[gameId].players[selectedCodeMaker].addr;

            emit CodeMakerSelected(gameId, games[gameId].codeMaker[turnNumber]);
        } else {
            games[gameId].nextMoveTo = getOpponent(gameId, msg.sender);
            
            emit Rise(gameId, betValue, msg.sender);
        }
    }

    function fold(uint gameId) external validateGame(gameId) {
        games[gameId].afkStart = 0;

        pokerBetting.fold(gameId, msg.sender);

        removeConnectedPlayer(games[gameId].players[0].addr);
        removeConnectedPlayer(games[gameId].players[1].addr);

        games[gameId].nextMoveTo = address(0);
        games[gameId].gameFinished = true;

        emit Fold(gameId, msg.sender);
    }

    function publishSecret(uint gameId, bytes32 secret) external validateGame(gameId) {
        require(pokerBetting.isBetFinished(gameId), "Bet is not finished yet");
        require(games[gameId].nextMoveTo == msg.sender, "Not your turn");
        
        games[gameId].afkStart = 0;

        uint turnNumber = games[gameId].currentTurn;

        games[gameId].secretCodeHash[turnNumber] = secret;
        games[gameId].nextMoveTo = getCodeBreakerAddress(gameId, msg.sender);

        emit SecretPublished(gameId, secret);
    }

    function tryGuess(uint gameId, bytes1[] memory guess) external validateGameForGuess(gameId, guess) {
        games[gameId].afkStart = 0;
        
        uint turnNumber = games[gameId].currentTurn;
        uint guessNumber = games[gameId].currentGuess;
        bytes1[N] memory fixedSizeGuess = convertToFixedLength(guess);

        games[gameId].turns[turnNumber].guesses[guessNumber] = fixedSizeGuess;
        games[gameId].nextMoveTo = games[gameId].codeMaker[turnNumber];

        emit Guess(gameId, fixedSizeGuess, turnNumber, guessNumber);
    }

    function publishFeedback(uint gameId, uint cc, uint nc) external validateFeedback(gameId) {
        games[gameId].afkStart = 0;
        
        uint turnNumber = games[gameId].currentTurn;
        uint guessNumber = games[gameId].currentGuess;

        games[gameId].turns[turnNumber].correctColorPosition[guessNumber] = cc;
        games[gameId].turns[turnNumber].notCorrectColorPosition[guessNumber] = nc;

        games[gameId].currentGuess++;

        if (cc == N) {
            games[gameId].isCodeGuessed[turnNumber] = false;
            emit RevealSecret(gameId);

            return;
        }

        if (games[gameId].currentGuess == NG) {
            games[gameId].isCodeGuessed[turnNumber] = true;
            emit RevealSecret(gameId);

            return;
        }

        games[gameId].nextMoveTo = getCodeBreakerAddress(gameId, msg.sender);
        emit Feedback(gameId, cc, nc, turnNumber, guessNumber);
    }

    function revealSecret(uint gameId, bytes1[] memory guess, string memory _salt) external validateRevealSecret(gameId) {
        games[gameId].afkStart = 0;
        
        uint turnNumber = games[gameId].currentTurn;
        address codeBreakerAddress = getCodeBreakerAddress(gameId, msg.sender);
        bytes1[N] memory fixedSizeGuess = convertToFixedLength(guess);

        games[gameId].salt[turnNumber] = _salt;
        games[gameId].secretCode[turnNumber] = fixedSizeGuess;

        bytes32 computedSecret = concatenateAndHash(guess, _salt);

        if (computedSecret != games[gameId].secretCodeHash[turnNumber]) {
            uint prize = pokerBetting.withdraw(gameId, payable(codeBreakerAddress));

            emit PlayerDishonest(gameId, msg.sender);

            games[gameId].gameFinished = true;
            games[gameId].winner = codeBreakerAddress;
            games[gameId].finalPrize = prize;
        }

        games[gameId].disputeStart = block.number;
        emit DisputeAvailable(gameId);
    }

    function startDispute(uint gameId, uint guessReference) external validateDispute(gameId, guessReference) {
        uint turnNumber = games[gameId].currentTurn;

        bytes1[N] memory guess = games[gameId].turns[turnNumber].guesses[guessReference];
        uint cc = games[gameId].turns[turnNumber].correctColorPosition[guessReference];
        uint nc = games[gameId].turns[turnNumber].notCorrectColorPosition[guessReference];
        bytes1[N] memory code = games[gameId].secretCode[turnNumber];

        address payable disputeWinner;

        if (isCcEqual(code, guess, cc) && isNcEqual(code, guess, nc)) {
            disputeWinner = payable(games[gameId].codeMaker[turnNumber]);
        } else {
            disputeWinner = payable(msg.sender);
        }

        uint prize = pokerBetting.withdraw(gameId, disputeWinner);
        emit DisputeOutcome(gameId, disputeWinner);

        games[gameId].gameFinished = true;
        games[gameId].winner = disputeWinner;
        games[gameId].finalPrize = prize;
    }

    function changeTurn(uint gameId) external validateChangeTurn(gameId) {
        games[gameId].afkStart = 0;
        
        uint turnNumber = games[gameId].currentTurn;

        //Points computation
        if (games[gameId].isCodeGuessed[turnNumber])
            addPoints(gameId, true);
        else
            addPoints(gameId, false);

        //Game termination check
        if (turnNumber == NT - 1) {
            withdrawPrize(gameId);
            return;
        }
        
        //Turn change
        games[gameId].currentTurn++;
        games[gameId].currentGuess = 0;
        address codeBreaker = getCodeBreakerAddress(gameId, msg.sender);
        games[gameId].codeMaker[games[gameId].currentTurn] = codeBreaker;
        games[gameId].nextMoveTo = codeBreaker;

        emit NewTurn(gameId, codeBreaker, msg.sender);
    }

    function addPoints(uint gameId, bool extraPoints) internal {
        uint awardedPoints = games[gameId].currentGuess;
        uint turnNumber = games[gameId].currentTurn;

        if (extraPoints)
            awardedPoints += K;
        
        uint index = getCodeMakerIndex(gameId, games[gameId].codeMaker[turnNumber]);
        games[gameId].players[index].points += awardedPoints;
    }

    function withdrawPrize(uint gameId) internal {
        address payable _winner;
        uint prize;

        games[gameId].gameFinished = true;

        if (games[gameId].players[0].points == games[gameId].players[1].points) {
            prize = pokerBetting.withdrawTie(gameId);

            games[gameId].isGameTied = true;
            games[gameId].finalPrize = prize;

            emit GameEndedWithTie(gameId);

            return;
        }

        if (games[gameId].players[0].points > games[gameId].players[1].points)
            _winner = payable(games[gameId].players[0].addr);
        else
            _winner = payable(games[gameId].players[1].addr);
        
        prize = pokerBetting.withdraw(gameId, _winner);

        games[gameId].winner = _winner;
        games[gameId].finalPrize = prize;

        emit GameEnded(gameId, _winner, prize);
    }

    function emitAfk(uint gameId) external validateEmitAfk(gameId) {
        games[gameId].afkStart = block.number;

        emit Afk(gameId, msg.sender);
    }

    function redeemAfterAfk(uint gameId) external validateRedeemAfterAfk(gameId) {
        uint prize = pokerBetting.withdraw(gameId, payable(msg.sender));

        games[gameId].gameFinished = true;
        games[gameId].winner = msg.sender;
        games[gameId].finalPrize = prize;

        emit GameEndedDueToAfk(gameId, msg.sender, prize);
    }

    function getCodeMakerIndex(uint index, address codeMakerAddress) internal view returns(uint) {
        if (games[index].players[0].addr == codeMakerAddress)
            return 0;
        
        if (games[index].players[1].addr == codeMakerAddress)
            return 1;

        revert("Invalid CodeMaker address");
    }

    function getCodeBreakerAddress(uint index, address codeMakerAddress) internal view returns(address) {
        if (games[index].players[0].addr == codeMakerAddress)
            return games[index].players[1].addr;
        
        if (games[index].players[1].addr == codeMakerAddress)
            return games[index].players[0].addr;

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

    function getOpponent(uint gameId, address player) internal view returns(address) {
        if (games[gameId].players[0].addr == player)
            return games[gameId].players[1].addr;
        
        if (games[gameId].players[1].addr == player)
            return games[gameId].players[0].addr;

        revert("Invalid address provided");
    }

    function getCodeMaker(uint gameId, uint turnNumber) external view returns(address) {
        return games[gameId].codeMaker[turnNumber];
    }

    function getPlayerAddress(uint gameId, uint playerIndex) external view returns(address) {
        return games[gameId].players[playerIndex].addr;
    }

    function getInvitedPlayer(uint gameId) external view returns(address) {
        return games[gameId].invitedPlayer;
    }

    function isGameFinished(uint gameId) external view returns(bool) {
        return games[gameId].gameFinished;
    }

    function isGameTied(uint gameId) external view returns(bool) {
        return games[gameId].isGameTied;
    }

    function getSecretCodeHash(uint gameId, uint turnNumber) external view returns(bytes32) {
        return games[gameId].secretCodeHash[turnNumber];
    }

    function getWinner(uint gameId) external view returns(address) {
        return games[gameId].winner;
    }

    function getFinalPrize(uint gameId) external view returns(uint) {
        return games[gameId].finalPrize;
    }

    function getCurrentTurn(uint gameId) external view returns(uint) {
        return games[gameId].currentTurn;
    }

    function getCurrentGuess(uint gameId) external view returns(uint) {
        return games[gameId].currentGuess;
    }
    
    function getPointsForPlayer(uint gameId, uint playerIndex) external view returns(uint) {
        return games[gameId].players[playerIndex].points;
    }
}