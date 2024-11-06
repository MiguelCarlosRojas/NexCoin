import Web3 from "web3";
import NexCoinABI from "./NexCoin.json";

export const getNexCoinContract = (
    web3: Web3,
    account: string,
    contractAddress: string
) => {
    console.log(
        "Creando instancia del contrato en la dirección:",
        contractAddress
    );
    return new web3.eth.Contract(NexCoinABI, contractAddress, {
        from: account,
    });
};
