// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "hardhat/console.sol";

contract PokerBettingProtocol {
    /*  Variables declaration  */
    mapping(uint256 => address[2]) public players;
    mapping(uint256 => uint[2]) public bets;
    mapping(uint256 => address) public nextMove;

    address immutable breakTheHiddenCodeAddress;

    /*  Events declaration  */
    event NewBet(uint index);
    event Rise(uint index, uint amount);
    event Check(uint index);
    event Fold(uint index);

    constructor(address bthcAddress) {
        breakTheHiddenCodeAddress = bthcAddress;
    }

    modifier validateCall(uint index) {
        require(players[index][0] != address(0) && players[index][1] != address(0), "Index doesn't exists");
        require(nextMove[index] == msg.sender, "Invalid sender address. Not your turn");

        _;
    }

    function newBetting(address player1, uint index) public {
        require(player1 != address(0), "Invalid address");
        require(players[index][0] == address(0) && players[index][1] == address(0), "Index already in use");
        require(player1 != msg.sender, "Can't open a new bet with yourself");

        players[index][0] = player1;
        players[index][1] = msg.sender;

        nextMove[index] = player1;

        emit NewBet(index);
    }

    function bet(uint256 index) payable public validateCall(index) { //TODO Aggiungere la finestra di AFK
        require(msg.value > 0, "Invalid bet amount");

        (uint senderBet, uint opponentBet) = getBets(index);
        (uint senderIndex, uint opponentIndex) = getPlayersIndex(index);

        require(senderBet + msg.value >= opponentBet, "Sendend amount is not valid");

        bets[index][senderIndex] += msg.value;
        nextMove[index] = players[index][opponentIndex];

        uint betDifference = senderBet + msg.value - opponentBet;
        if (betDifference == 0) {
            nextMove[index] = address(0);
            emit Check(index);
        } else
            emit Rise(index, betDifference);
    }

    function fold(uint index) public validateCall(index) {
        (uint senderBet, uint opponentBet) = getBets(index);

        bets[index][0] = 0;
        bets[index][1] = 0;
        nextMove[index] = address(0);

        (address payable sender, address payable opponent) = getPlayersPaybleAddress(index);

        sender.transfer(senderBet);
        opponent.transfer(opponentBet);

        players[index][0] = address(0);
        players[index][1] = address(0);

        emit Fold(index);
    }

    function withdraw(uint index, address payable winner) public {
        require(breakTheHiddenCodeAddress == msg.sender, "This function can only be invoked by BreakTheHiddenCode contract");
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
    }

    function getBets(uint index) internal view returns(uint, uint) {
        uint senderBet;
        uint opponentBet;

        if (players[index][0] == msg.sender) {
            senderBet = bets[index][0];
            opponentBet = bets[index][1];
        }
        else {
            senderBet = bets[index][1];
            opponentBet = bets[index][0];
        }

        return (senderBet, opponentBet);
    }

    function getPlayersIndex(uint index) internal view returns(uint, uint) {
        uint senderIndex;
        uint opponentIndex;

        if (players[index][0] == msg.sender) {
            senderIndex = 0;
            opponentIndex = 1;
        }
        else {
            senderIndex = 1;
            opponentIndex = 0;
        }

        return (senderIndex, opponentIndex);
    }

    function getPlayersPaybleAddress(uint index) internal view returns(address payable, address payable) {
        address payable opponent;
        if (players[index][0] == msg.sender)
            opponent = payable(players[index][1]);
        else
            opponent = payable(players[index][0]);

        return (payable(msg.sender), opponent);
    }
}