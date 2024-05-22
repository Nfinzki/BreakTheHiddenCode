// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "./PokerBettingProtocol.sol";

contract BreakTheHiddenCode {
    /*  Variables declaration */
    uint256 private nextGameId;

    //address 0 contains the creator of the game
    //address 1 contains the player who joins the game
    //address 2 contains the invited player
    mapping(uint256 => address[3]) public games;

    uint256[] joinableGames;

    address[] connectedPlayers;

    PokerBettingProtocol pokerBetting;

    uint constant N = 5; //Length of the orderd sequence
    uint constant M = 9; //Number of possible colors
    uint constant K = 3; //Extra points to be rewarded
    uint constant NT = 4; //Number of turns
    uint constant NG = 5; //Number of guesses

    bytes1[] public ammissibleColors;

    mapping(uint256 => address) public codeMaker;
    mapping(uint256 => uint[2]) points;
    mapping(uint256 => bytes32) public secretCodeHash;
    mapping(uint256 => string) public salt;

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

    /*  Constant utilities */
    uint32 constant gasLimit = 3000000;
    
    constructor() {
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
    }

    modifier validateGame(uint gameId) {
        require(games[gameId][0] != address(0) && games[gameId][1] != address(0), "Game not found");
        require(games[gameId][0] == msg.sender || games[gameId][1] == msg.sender, "Not authorized to interact with this game");
       
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

            uint selectedCodeMaker = getRandom(2);
            codeMaker[gameId] = games[gameId][selectedCodeMaker];
            emit CodeMakerSelected(gameId, codeMaker[gameId]);
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
        require(codeMaker[gameId] == msg.sender, "Not the CodeMaker");

        secretCodeHash[gameId] = secret;

        emit SecretPublished(gameId);
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
}