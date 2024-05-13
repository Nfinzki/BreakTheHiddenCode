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

    PokerBettingProtocol pokerBetting;

    /*  Events declaration */
    event GameCreated(uint gameId);
    event GameCreatedForAnOpponent(uint gameId, address opponent);
    event UserJoined(address opponent, uint gameId);
    
    constructor() {
        nextGameId = 0;
        pokerBetting = new PokerBettingProtocol(address(this), 30 seconds);
    }

    function createGame() public {
        games[nextGameId][0] = msg.sender;
        joinableGames.push(nextGameId);
        nextGameId++;

        emit GameCreated(nextGameId - 1);
    }

    function createGame(address opponentAddress) public {
        require(opponentAddress != address(0), "Invalid opponent address");
        require(msg.sender != opponentAddress, "Can't create a game with yourself");
    
        games[nextGameId][0] = msg.sender;
        games[nextGameId][2] = opponentAddress;
        nextGameId++;

        emit GameCreatedForAnOpponent(nextGameId - 1, opponentAddress);
    }

    function joinGame() public {
        require(nextGameId > 0, "Currently there are no existing games");
        require(joinableGames.length > 0, "There are no games to join");
        
        uint index = getRandom();
        uint gameId = joinableGames[index];

        //TODO Check if the address trying to join is the same as the one that created the game

        removeFromArray(index);

        games[gameId][1] = msg.sender;

        emit UserJoined(msg.sender, gameId);

        pokerBetting.newBetting(games[gameId][0], gameId);
    }

    function joinGameById(uint gameId) public {
        require(nextGameId > 0, "Currently there are no existing games");
        require(games[gameId][0] != address(0), "Game doesn't exists");
        require(games[gameId][2] == msg.sender, "Not authorized to join the game");

        games[gameId][1] = msg.sender;
        games[gameId][2] = address(0);

        emit UserJoined(msg.sender, gameId);

        pokerBetting.newBetting(games[gameId][0], gameId);
    }

    function getRandom() internal view returns (uint) {
        bytes32 bhash = blockhash(block.number-1);
        bytes memory bytesArray = new bytes(32);
        for (uint i = 0; i < 32; i++) {
            bytesArray[i] = bhash[i];
        }
        uint rand = uint(keccak256(bytesArray));

        return rand % joinableGames.length;
    }

    function removeFromArray(uint index) internal {
        joinableGames[index] = joinableGames[joinableGames.length - 1];
        joinableGames.pop();
    }
}