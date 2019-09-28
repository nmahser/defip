import { account, userPermission } from "./balance-contractConnect.js";


//ERC20 tokens abi
// prettier-ignore
const tokensAbi = [{"constant": true,"inputs": [{"name": "_owner","type": "address"}],"name": "balanceOf","outputs": [{"name": "balance","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [{"name": "_owner","type": "address"},{"name": "_spender","type": "address"}],"name": "allowance","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": false,"inputs": [{"name":"_spender","type": "address"},{"name": "_value","type": "uint256"}],"name": "approve", "outputs": [{"name": "","type": "bool"}],"payable": false,"stateMutability": "nonpayable","type": "function"},{"anonymous": false,"inputs": [{"indexed": true,"name": "_owner","type": "address"},{"indexed": true,"name": "_spender","type": "address"},{"indexed": false,"name": "_value","type": "uint256"}],"name": "Approval","type": "event"}];

//Kyber smart contract tokensAbi
// prettier-ignore
const kyberMainABI = [{"constant": true,"inputs": [],"name": "enabled","outputs": [{"name": "","type": "bool"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [{"name": "src","type": "address"},{"name": "dest","type": "address"},{"name": "srcQty","type": "uint256"}],"name": "getExpectedRate","outputs": [{"name": "expectedRate","type": "uint256"},{"name": "slippageRate","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "maxGasPrice","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": false,"inputs": [{"name": "src","type": "address"},{"name": "mount","type": "uint256"},{"name": "dest","type": "address"},{"name": "destAddress","type": "address"},{"name": "maxDestAmount","type": "uint256"},{"name": "minConversionRate","type": "uint256"},{"name": "walletId","type": "address"}],"name": "trade","outputs": [{"name": "","type": "uint256"}],"payable": true,"stateMutability": "payable","type": "function"},{"anonymous": false,"inputs": [{"indexed": true,"name": "trader","type": "address"},{"indexed": false,"name": "src","type": "address"},{"indexed": false,"name": "dest","type": "address"},{"indexed": false,"name": "actualmount","type": "uint256"},{"indexed": false,"name": "actualDestAmount","type": "uint256"}],"name": "ExecuteTrade","type": "event"}];


async function userWeb3() {
  try {
    const mainKyberAddress = "0x818E6FECD516Ecc3849DAf6845e3EC868087B755";
    let kyberContract = await new web3.eth.Contract(
      kyberMainABI,
      mainKyberAddress
    );
    return kyberContract;
  } catch (error) {
    console.log(error);
  }
}


//This is called expected rate because market conditions can suddenly change.
//Kyber has a variable called slippageRate which is 3% lower than expected rate
//When you use expected rate there is a chance that your transaction will be reverted because
//someone else was already traded. Rememver it takes 15 seconds for a transaction to be "validated"
//For now we are only displaying slippageRate. However, Kyber contract has different options to use.

function expectedRateBuy(kyberContract) {
  return new Promise((resolve, reject) => {
    let tokenSrc = $("#tokenSource").val();
    let qty = $("#amountEntryBuy").val();
    let tokenQty = web3.utils.toWei(qty);
    let tokenDest = $("#tokenAddress").val();
    let maxRateInWei;
    let slippageRateInWei;
    kyberContract.methods
      .getExpectedRate(tokenSrc, tokenDest, tokenQty)
      .call((err, res) => {
        if (!err) {
          maxRateInWei = String(res[0]); 
          const max = String(maxRateInWei * tokenQty);
          slippageRateInWei = String(res[1]);
          const min = slippageRateInWei * tokenQty;
          const maxRateBuy = max / Math.pow(10, Math.floor(36));
          $("#maxRateBuy").html(maxRateBuy.toFixed(4));
          const minRateBuy = min / Math.pow(10, Math.floor(36));
          $("#minRateBuy").html(minRateBuy.toFixed(4));
        } else {
          console.log(err);
        }
        let rates = slippageRateInWei;
        resolve(rates);
      });
  });
}

function expectedRateSell(kyberContract) {
  return new Promise((resolve, reject) => {
    let tokenSrc = $("#tokenSourceSell").val();
    let qty = $("#amountEntrySell").val();
    let tokenQty = web3.utils.toWei(qty);
    let tokenDest = $("#tokenAddressSell").val(); //ETH token address
    let maxRateInWei;
    let slippageRateInWei;
    kyberContract.methods
      .getExpectedRate(tokenSrc, tokenDest, tokenQty)
      .call((err, res) => {
        if (!err) {
          maxRateInWei = String(res[0]);
          const max = String(maxRateInWei * tokenQty);
          slippageRateInWei = String(res[1]);
          const min = slippageRateInWei * tokenQty;
          const maxRateSell = max / Math.pow(10, Math.floor(36));
          $("#maxRateSell").html(maxRateSell.toFixed(4));
          const minRateSell = min / Math.pow(10, Math.floor(36));
          $("#minRateSell").html(minRateSell.toFixed(4));
        } else {
          console.log("wtfSell");
          console.log(err);
        }
        let rates = slippageRateInWei;
        resolve(rates);
      });
  });
}

//Gas price is hard coded. We should give user an option to choose.
//Remember, the highest gas price is 50Gwei. This is used to reduce forrunner trading.
function buy(min, account, kyberContract) {
  let tokenSrc = $("#tokenSource").val();
  let tokenDest = $("#tokenAddress").val();
  let qty = $("#amountEntryBuy").val();
  let walletId = "0x0000000000000000000000000000000000000000";
  //THis is 2^power something. Forgot the reason.
  let maxDestAmount =
    "5789604500000000000000000000000000000000000000000000000000000000000000000000000000000";
  let value_tx = web3.utils.toWei(qty);
  console.log(value_tx);
  return new Promise((resolve, reject) => {
    kyberContract.methods
      .trade(
        tokenSrc,
        value_tx,
        tokenDest,
        account,
        maxDestAmount,
        min,
        walletId
      )
      .send(
        {
          from: account,
          gasPrice: "200000000",
          gas: 300000,
          value: value_tx
        },
        (err, res) => {
          console.log(res, err);
          if (!err) {
            resolve(res);
          } else {
            console.log(err);
            reject(err.message);
          }
        }
      );
  });
}

function sell(min, account, kyberContract) {
  let tokenSrc = $("#tokenSourceSell").val();
  let tokenDest = $("#tokenAddressSell").val();
  let qty = $("#amountEntrySell").val(); // not using
  let walletId = "0x0000000000000000000000000000000000000000";
  let maxDestAmount =
    "5789604500000000000000000000000000000000000000000000000000000000000000000000000000000";
  //let value_tx = web3.utils.fromWei(min , 'ether');
  //let value_tx = web3.utils.fromWei(qty);
  //Of course this needs to be changed. There is a lib called bignumber
  let value_tx = String(min * Math.pow(10,Math.floor(3)));
  return new Promise((resolve, reject) => {
    kyberContract.methods
      .trade(
        tokenSrc,
        value_tx,
        tokenDest,
        account,
        maxDestAmount,
        min,
        walletId
      )
      .send(
        {
          from: account,
          gasPrice: "200000000",
          gas: 300000,
          value: value_tx
        },
        (err, res) => {
          console.log(res, err);
          if (!err) {
            resolve(res);
          } else {
            console.log(err);
            reject(err.message);
          }
        }
      );
  });
}


//Returns expected buy rates
document
  .getElementById("amountEntryBuy")
  .addEventListener("input", function() {
    try {
      userWeb3().then(result => {
        return expectedRateBuy(result);
      });
    } catch (error) {
      console.log(error);
    }
  });

  //Returns expected sell rates
  document
  .getElementById("amountEntrySell")
  .addEventListener("input", function() {
    try {
      userWeb3().then(result => {
        return expectedRateSell(result);
      });
    } catch (error) {
      console.log(error);
    }
  });


$(document).ready(function() {
  //This function should be utilized. Consider if calling expectedRateBuy again is necessary.
  $("#buyButton").click(function() {
    //Missing try catches;
    let accountPromise = account().then(function(account) {
      return account;
    });
    let userWeb3Promise = userWeb3().then(function(userWeb3) {
      return userWeb3;
    });
    let expectedRateBuyPromise = userWeb3().then(result => {
      return expectedRateBuy(result);
    })
    Promise.all([expectedRateBuyPromise, accountPromise,userWeb3Promise]).then(function(values) {
      buy(values[0], values[1],values[2]).catch(error => console.log(error));
    });
  });

  $("#sellButton").click(function() {
    let accountPromise = account().then(function(account) {
      return account;
    });
    let userWeb3Promise = userWeb3().then(function(userWeb3) {
      return userWeb3;
    });
    let expectedRateSellPromise = userWeb3().then(result => {
      return expectedRateSell(result);
    });

    Promise.all([expectedRateSellPromise, accountPromise,userWeb3Promise]).then(function(values) {
      sell(values[0], values[1], values[2]).catch(error => console.log(error));
    });
  });
});
