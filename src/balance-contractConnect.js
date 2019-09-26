const Web3 = require("../node_modules/web3/");

const web3_utils = require("web3-utils");

import { getAddressBalances } from "eth-balance-checker/lib/web3";

//ERC20 tokens abi
// prettier-ignore
const tokensAbi = [{"constant": true,"inputs": [{"name": "_owner","type": "address"}],"name": "balanceOf","outputs": [{"name": "balance","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [{"name": "_owner","type": "address"},{"name": "_spender","type": "address"}],"name": "allowance","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": false,"inputs": [{"name":"_spender","type": "address"},{"name": "_value","type": "uint256"}],"name": "approve", "outputs": [{"name": "","type": "bool"}],"payable": false,"stateMutability": "nonpayable","type": "function"},{"anonymous": false,"inputs": [{"indexed": true,"name": "_owner","type": "address"},{"indexed": true,"name": "_spender","type": "address"},{"indexed": false,"name": "_value","type": "uint256"}],"name": "Approval","type": "event"}];

//Kyber smart contract tokensAbi
// prettier-ignore
const kyberMainABI = [{"constant": true,"inputs": [],"name": "enabled","outputs": [{"name": "","type": "bool"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [{"name": "src","type": "address"},{"name": "dest","type": "address"},{"name": "srcQty","type": "uint256"}],"name": "getExpectedRate","outputs": [{"name": "expectedRate","type": "uint256"},{"name": "slippageRate","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "maxGasPrice","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": false,"inputs": [{"name": "src","type": "address"},{"name": "mount","type": "uint256"},{"name": "dest","type": "address"},{"name": "destAddress","type": "address"},{"name": "maxDestAmount","type": "uint256"},{"name": "minConversionRate","type": "uint256"},{"name": "walletId","type": "address"}],"name": "trade","outputs": [{"name": "","type": "uint256"}],"payable": true,"stateMutability": "payable","type": "function"},{"anonymous": false,"inputs": [{"indexed": true,"name": "trader","type": "address"},{"indexed": false,"name": "src","type": "address"},{"indexed": false,"name": "dest","type": "address"},{"indexed": false,"name": "actualmount","type": "uint256"},{"indexed": false,"name": "actualDestAmount","type": "uint256"}],"name": "ExecuteTrade","type": "event"}];

//get all ERC20 token balances in the wallet
//For now we are using a library for this. But we can also deploy our smart contract
//To check all the balances of ERC20 tokens
// reference: https://medium.com/@wbobeirne/get-all-eth-token-balances-for-multiple-addresses-in-a-single-node-call-4d0bcd1e5625

//User permission; to be able to inject user wallet into web
const userPermission = async () => {
  // Modern dapp browsers...
  if (window.ethereum) {
    window.web3 = new Web3(ethereum);
    try {
      // Request account access if needed
      await ethereum.enable();
      /// Acccounts now exposed
      /*web3.eth.sendTransaction({
        // ... //
      });*/
    } catch (error) {
      // User denied account access...
    }
  }
  // Non-dapp browsers...
  else {
    console.log(
      "Non-Ethereum browser detected. You should consider trying MetaMask!"
    );
  }
};

function account() {
  return new Promise((resolve, reject) => {
    let currentAccount;
    web3.eth.getAccounts((err, res) => {
      if (!err) {
        currentAccount = String(res);
      } else {
        console.log(err);
        reject(err.message);
      }
      const account = currentAccount;
      resolve(account);
    });
  });
}

async function getTokensInfo() {
  try {
    let request = await fetch("https://api.kyber.network/currencies");
    let fetchedTokenInfo = await request.json();
    //convert json object to array
    let getTokenData = Object.values(fetchedTokenInfo.data);
    // delete unnecesary elements
    let tokensInfo = getTokenData.map(
      ({ decimals, id, name, reserves_dest, reserves_src, ...keep }) => keep
    );

    return tokensInfo;
  } catch (e) {
    console.log("Tokens addresses fetching error!" + e);
  }
}

/* this library only works for  Mainnet. Also, it is not smart to rely on someone else's smart contract and library. We should deploy ours for the production
function allBalances(address, tokensInfo) {
  return new Promise((resolve, reject) => {
    const web3 = new Web3(ethereum); // do I need to create web3 variable? of course not...

    let allAddress = tokensInfo.map(all => all.address);

    //Kyber uses dummy eth address for some reason. gotta convert it to real eth address for eth-balance-check
    tokensInfo[0].address = "0x0000000000000000000000000000000000000000";
    //Delete unnecesary elements in the Object
    // Convert dummy to real ETH address
    allAddress.shift();
    //Kyber api gives "0xeeee for ETH"
    allAddress.unshift("0x0000000000000000000000000000000000000000");
    getAddressBalances(web3, address, allAddress)
      .then(balances => {
        tokensInfo.forEach((key, i) => {
          let getAddress = tokensInfo[i].address;
          let amount = balances[getAddress];
          //add amount of each token to tokensInfo
          Object.assign(tokensInfo[i], { amount: amount });
        });
        resolve(tokensInfo);
      })
      .catch(error => reject(error));
  });
}
*/
function getBalance(account) {
  web3.eth.getBalance(account, function(err, res) {
    let ethQtyInWei;
    if (!err) {
      ethQtyInWei = String(res);
    } else {
      console.log(err);
    }
    const balance = web3_utils.fromWei(ethQtyInWei, "ether");
    $("#balance").html(balance.slice(0, 6));
  });
}

$(document).ready(function() {
  $("#button-Metamask").on("click", async () => {
    try {
      await userPermission();
      account().then(account => {
        return getBalance(account);
      });
      //When user wallet is connect to the website, user (web3 provider) weill be connected to kyber smart contract
      const mainKyberAddress = "0x818E6FECD516Ecc3849DAf6845e3EC868087B755";
      const kyberContract = await new web3.eth.Contract(
        kyberMainABI,
        mainKyberAddress
      );
      /*
      Promise.all([account(), getTokensInfo()]).then(function(values) {
        allBalances(values[0], values[1])
          .then(allBalance => {
            allBalance.map((key, i) => {
              delete allBalance[i].address;
            });
            let table = document.querySelector("#userAllBalance");
            for (let element of allBalance) {
              let row = table.insertRow();
              for (let key in element) {
                let cell = row.insertCell();
                let text = document.createTextNode(element[key]);
                cell.appendChild(text);
              }
            }
            return allBalance;
          })
          .catch(error => console.log(error));
      });*/
    } catch (error) {
      console.log(error + "getBalance()");
    }
  });
});
