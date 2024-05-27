// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "hardhat/console.sol";

contract PokerBettingProtocol {
    /*  Variables declaration  */
    mapping(uint256 => address[2]) public players;
    mapping(uint256 => uint[2]) public bets;
    mapping(uint256 => address) public nextMove;
    mapping(uint256 => uint256) public lastMove;

    uint256 afkTolerance;

    address immutable breakTheHiddenCodeAddress;

    /*  Events declaration  */
    event NewBet(uint index);
    event Rise(uint index, uint amount);
    event Check(uint index);
    event Fold(uint index);
    event Afk(uint index);
    event Withdraw(uint index, address receiver, uint amount);
    event WithdrawTie(uint index, address player1, address player2);

    constructor(address _breakTheHiddenCodeAddress, uint256 _afkTolerance) {
        breakTheHiddenCodeAddress = _breakTheHiddenCodeAddress;
        afkTolerance = _afkTolerance;
    }

    modifier validateCall(uint index, address playerAddress) {
        require(breakTheHiddenCodeAddress == msg.sender, "This function can only be invoked by BreakTheHiddenCode contract");
        require(players[index][0] != address(0) && players[index][1] != address(0), "Index doesn't exists");
        require(playerAddress != address(0), "The provided address is null");
        require(nextMove[index] == playerAddress, "Invalid sender address. Not your turn");

        _;
    }

    modifier validateBthcAddress() {
        require(breakTheHiddenCodeAddress == msg.sender, "This function can only be invoked by BreakTheHiddenCode contract");

        _;
    }

    function newBetting(address player1, address player2, uint index) external validateBthcAddress() {
        require(player1 != address(0) && player2 != address(0), "Invalid address");
        require(players[index][0] == address(0) && players[index][1] == address(0), "Index already in use");
        require(player1 != player2, "Can't open a new bet with yourself");

        players[index][0] = player1;
        players[index][1] = player2;

        nextMove[index] = player1;

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

        bets[index][senderIndex] += msg.value;
        nextMove[index] = players[index][opponentIndex];

        lastMove[index] = block.timestamp; //Update the timestamp of the last move

        uint betDifference = senderBet + msg.value - opponentBet;
        if (betDifference == 0) {
            nextMove[index] = address(0);
            emit Check(index);
            return (true, bets[index][0]);
        }
            
        emit Rise(index, betDifference);
        return (false, betDifference);
    }

    function fold(uint index, address playerAddress) external validateCall(index, playerAddress) {
        (uint senderBet, uint opponentBet) = getBets(index, playerAddress);

        bets[index][0] = 0;
        bets[index][1] = 0;
        nextMove[index] = address(0);

        (address payable sender, address payable opponent) = getPlayersPaybleAddress(index, playerAddress);

        sender.transfer(senderBet);
        opponent.transfer(opponentBet);

        players[index][0] = address(0);
        players[index][1] = address(0);

        emit Fold(index);
    }

    function issueAfk(uint index, address playerAddress) external validateBthcAddress() {
        require(players[index][0] != address(0) && players[index][1] != address(0), "Index doesn't exists");
        require(playerAddress != address(0), "The provied address is null");
        require(players[index][0] == playerAddress || players[index][1] == playerAddress, "This address is not part of this betting");
        require(nextMove[index] != playerAddress, "Invalid sender address. You can't issue the AFK status if it's your turn");
        require(bets[index][0] != 0 || bets[index][1] != 0, "Bet not started yet");
        require(block.timestamp > lastMove[index] + afkTolerance, "The opponent still has time to make a choice");

        uint weiWon = bets[index][0] + bets[index][1];

        players[index][0] = address(0);
        players[index][1] = address(0);
        nextMove[index] = address(0);
        bets[index][0] = 0;
        bets[index][1] = 0;

        payable(playerAddress).transfer(weiWon);

        emit Afk(index);
    }

    function withdraw(uint index, address payable winner) external validateBthcAddress() returns(uint) {
        require(players[index][0] != address(0) && players[index][1] != address(0), "Index doesn't exist");
        require(players[index][0] == winner || players[index][1] == winner, "Winner address doesn't exist");
        require(bets[index][0] != 0 && bets[index][1] != 0, "Bet not started yet");
        require(bets[index][0] == bets[index][1], "The bet is not already agreed");

        uint weiWon = bets[index][0] + bets[index][1];

        players[index][0] = address(0);
        players[index][1] = address(0);
        bets[index][0] = 0;
        bets[index][1] = 0;

        winner.transfer(weiWon);

        emit Withdraw(index, winner, weiWon);

        return weiWon;
    }

    function withdrawTie(uint index) external validateBthcAddress() {
        require(players[index][0] != address(0) && players[index][1] != address(0), "Index doesn't exist");
        require(bets[index][0] != 0 && bets[index][1] != 0, "Bet not started yet");
        require(bets[index][0] == bets[index][1], "The bet is not already agreed");

        address payable player1 = payable(players[index][0]);
        address payable player2 = payable(players[index][1]);
        uint amount1 = bets[index][0];
        uint amount2 = bets[index][1];

        players[index][0] = address(0);
        players[index][1] = address(0);
        bets[index][0] = 0;
        bets[index][1] = 0;

        player1.transfer(amount1);
        player2.transfer(amount2);

        emit WithdrawTie(index, player1, player2);
    }

    function isBetCreated(uint index) public view returns(bool) {
        return players[index][0] != address(0) && players[index][1] != address(0);
    }

    function isBetFinished(uint index) public view returns(bool) {
        require(players[index][0] != address(0) && players[index][1] != address(0), "Index doesn't exists");
        require(bets[index][0] != 0 && bets[index][1] != 0, "Bet not started yet");

        return bets[index][0] == bets[index][1];
    }

    function getBets(uint index, address playerAddress) internal view returns(uint, uint) {
        uint senderBet;
        uint opponentBet;

        if (players[index][0] == playerAddress) {
            senderBet = bets[index][0];
            opponentBet = bets[index][1];
        }
        else {
            senderBet = bets[index][1];
            opponentBet = bets[index][0];
        }

        return (senderBet, opponentBet);
    }

    function getPlayersIndex(uint index, address playerAddress) internal view returns(uint, uint) {
        uint senderIndex;
        uint opponentIndex;

        if (players[index][0] == playerAddress) {
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
        if (players[index][0] == playerAddress)
            opponent = payable(players[index][1]);
        else
            opponent = payable(players[index][0]);

        return (payable(playerAddress), opponent);
    }
}