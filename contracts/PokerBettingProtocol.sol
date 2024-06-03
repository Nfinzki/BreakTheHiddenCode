// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "hardhat/console.sol";

contract PokerBettingProtocol {
    struct Player {
        address addr;
        uint bet;
    }

    struct Bet {
        Player[2] players;
        address nextMove;
    }
    
    /*  Variables declaration  */
    mapping(uint256 => Bet) bets;

    address immutable mastermindAddress;

    /*  Events declaration  */
    event NewBet(uint index);
    event Rise(uint index, uint amount);
    event Check(uint index);
    event Fold(uint index);
    event Afk(uint index);
    event Withdraw(uint index, address receiver, uint amount);
    event WithdrawTie(uint index, address player1, address player2);

    constructor(address _mastermindAddress) {
        mastermindAddress = _mastermindAddress;
    }

    modifier validateCall(uint index, address playerAddress) {
        require(mastermindAddress == msg.sender, "This function can only be invoked by Mastermind contract");
        require(bets[index].players[0].addr != address(0) && bets[index].players[1].addr != address(0), "Index doesn't exists");
        require(playerAddress != address(0), "The provided address is null");
        require(bets[index].nextMove == playerAddress, "Invalid sender address. Not your turn");

        _;
    }

    modifier validateMastermindAddress() {
        require(mastermindAddress == msg.sender, "This function can only be invoked by Mastermind contract");

        _;
    }

    function newBetting(address player1, address player2, uint index) external validateMastermindAddress() {
        require(player1 != address(0) && player2 != address(0), "Invalid address");
        require(bets[index].players[0].addr == address(0) && bets[index].players[1].addr == address(0), "Index already in use");
        require(player1 != player2, "Can't open a new bet with yourself");

        bets[index].players[0].addr = player1;
        bets[index].players[1].addr = player2;

        bets[index].nextMove = player1;

        emit NewBet(index);
    }

    //This function returns:
    //'true' if the player chooses to Check (and thus the betting phase is terminated)
    //'false' if the player chooses to Rise (the betting phase continue)
    function bet(uint256 index, address playerAddress) payable external validateCall(index, playerAddress) returns(bool, uint) {
        require(msg.value > 0, "Invalid bet amount");

        (uint senderBet, uint opponentBet) = getBets(index, playerAddress);
        (uint senderIndex, uint opponentIndex) = getPlayersIndex(index, playerAddress);

        require(senderBet + msg.value >= opponentBet, "Sendend amount is not valid");

        bets[index].players[senderIndex].bet += msg.value;
        bets[index].nextMove = bets[index].players[opponentIndex].addr;

        uint betDifference = senderBet + msg.value - opponentBet;
        if (betDifference == 0) {
            bets[index].nextMove = address(0);
            emit Check(index);
            return (true, bets[index].players[0].bet);
        }
            
        emit Rise(index, betDifference);
        return (false, betDifference);
    }

    function fold(uint index, address playerAddress) external validateCall(index, playerAddress) {
        (uint senderBet, uint opponentBet) = getBets(index, playerAddress);

        bets[index].players[0].bet = 0;
        bets[index].players[1].bet = 0;
        bets[index].nextMove = address(0);

        (address payable sender, address payable opponent) = getPlayersPaybleAddress(index, playerAddress);

        sender.transfer(senderBet);
        opponent.transfer(opponentBet);

        bets[index].players[0].addr = address(0);
        bets[index].players[1].addr = address(0);

        emit Fold(index);
    }

    function withdraw(uint index, address payable winner) external validateMastermindAddress() returns(uint) {
        require(bets[index].players[0].addr != address(0) && bets[index].players[1].addr != address(0), "Index doesn't exist");
        require(bets[index].players[0].addr == winner || bets[index].players[1].addr == winner, "Winner address doesn't exist");
        require(bets[index].players[0].bet != 0 || bets[index].players[1].bet != 0, "Bet not started yet");

        uint weiWon = bets[index].players[0].bet + bets[index].players[1].bet;

        bets[index].players[0].addr = address(0);
        bets[index].players[1].addr = address(0);
        bets[index].players[0].bet = 0;
        bets[index].players[1].bet = 0;

        winner.transfer(weiWon);

        emit Withdraw(index, winner, weiWon);

        return weiWon;
    }

    function withdrawTie(uint index) external validateMastermindAddress() returns(uint) {
        require(bets[index].players[0].addr != address(0) && bets[index].players[1].addr != address(0), "Index doesn't exist");
        require(bets[index].players[0].bet != 0 && bets[index].players[1].bet != 0, "Bet not started yet");
        require(bets[index].players[0].bet == bets[index].players[1].bet, "The bet is not agreed yet");

        address payable player1 = payable(bets[index].players[0].addr);
        address payable player2 = payable(bets[index].players[1].addr);
        uint amount1 = bets[index].players[0].bet;
        uint amount2 = bets[index].players[1].bet;

        bets[index].players[0].addr = address(0);
        bets[index].players[1].addr = address(0);
        bets[index].players[0].bet = 0;
        bets[index].players[1].bet = 0;

        player1.transfer(amount1);
        player2.transfer(amount2);

        emit WithdrawTie(index, player1, player2);

        return amount1;
    }

    function isBetCreated(uint index) public view returns(bool) {
        return bets[index].players[0].addr != address(0) && bets[index].players[1].addr != address(0);
    }

    function isBetFinished(uint index) public view returns(bool) {
        require(bets[index].players[0].addr != address(0) && bets[index].players[1].addr != address(0), "Index doesn't exists");
        require(bets[index].players[0].bet != 0 && bets[index].players[1].bet != 0, "Bet not started yet");

        return bets[index].players[0].bet == bets[index].players[1].bet;
    }

    function getBets(uint index, address playerAddress) internal view returns(uint, uint) {
        uint senderBet;
        uint opponentBet;

        if (bets[index].players[0].addr == playerAddress) {
            senderBet = bets[index].players[0].bet;
            opponentBet = bets[index].players[1].bet;
        }
        else {
            senderBet = bets[index].players[1].bet;
            opponentBet = bets[index].players[0].bet;
        }

        return (senderBet, opponentBet);
    }

    function getPlayersIndex(uint index, address playerAddress) internal view returns(uint, uint) {
        uint senderIndex;
        uint opponentIndex;

        if (bets[index].players[0].addr == playerAddress) {
            senderIndex = 0;
            opponentIndex = 1;
        }
        else {
            senderIndex = 1;
            opponentIndex = 0;
        }

        return (senderIndex, opponentIndex);
    }

    function getPlayersPaybleAddress(uint index, address playerAddress) internal view returns(address payable, address payable) {
        address payable opponent;
        if (bets[index].players[0].addr == playerAddress)
            opponent = payable(bets[index].players[1].addr);
        else
            opponent = payable(bets[index].players[0].addr);

        return (payable(playerAddress), opponent);
    }

    function getPlayerAddress(uint betIndex, uint playerIndex) external view returns(address playerAddress) {
        return bets[betIndex].players[playerIndex].addr;
    }

    function getNextMove(uint betIndex) external view returns(address playerAddress) {
        return bets[betIndex].nextMove;
    }

    function getBetForPlayer(uint betIndex, uint playerIndex) external view returns(uint _bet) {
        return bets[betIndex].players[playerIndex].bet;
    }
}