import hre from "hardhat";

export function getBytesColors(colors: Array<string>): string[] {
    return colors.map(c => hre.ethers.hexlify(hre.ethers.toUtf8Bytes(c).slice(0, 4)));
}

export function getPlayersRole(player1: any, player2: any, codeMaker: any): {codeMakerAddress: any, codeBreakerAddress: any, codeMakerIndex: any, codeBreakerIndex: any} {
    let codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex;

    if (codeMaker === player1.address) {
        codeMakerAddress = player1;
        codeBreakerAddress = player2;
        codeMakerIndex = 0;
        codeBreakerIndex = 1;
    } else {
        codeMakerAddress = player2;
        codeBreakerAddress = player1;
        codeMakerIndex = 1;
        codeBreakerIndex = 0;
    }

    return {codeMakerAddress, codeBreakerAddress, codeMakerIndex, codeBreakerIndex};
}