/*
//Kyber Main
const mainKyberAddress = "0x818E6FECD516Ecc3849DAf6845e3EC868087B755";
const kyberContract = new web3.eth.Contract(kyberMainABI, mainKyberAddress);
*/
/*
//Kyber Ropsten not using for now
const coinAddress = "0x4E470dc7321E84CA96FcAEDD0C8aBCebbAEB68C6";
const coinContract = new web3.eth.Contract(tokensAbi, coinAddress);
*/

//This function is used also in balance.js. I am not sure why I have to redeclare it here.
//There has to be a simple way to connect two js files.

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

//This is called expected rate because market conditions can suddenly change.
//Kyber has a variable called slippageRate which is 3% lower than expected rate
//When you use expected rate there is a chance that your transaction will be reverted because
//someone else was already traded. Rememver it takes 15 seconds for a transaction to be "validated"
//For now we are only displaying slippageRate. However, Kyber contract has different options to use.
function expectedRateBuy() {
  console.log(kyberContract);
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
          maxRateInWei = String(res[0]); //String(res[0]);
          max = String(maxRateInWei * tokenQty);
          slippageRateInWei = String(res[1]);
          min = slippageRateInWei * tokenQty;
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

function expectedRateSell() {
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
          maxRateInWei = String(res[0]); //String(res[0]);
          max = String(maxRateInWei * tokenQty);
          slippageRateInWei = String(res[1]);
          min = slippageRateInWei * tokenQty;
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
function buy(min, account) {
  let tokenSrc = $("#tokenSource").val();
  let tokenDest = $("#tokenAddress").val();
  let qty = $("#amountEntryBuy").val();
  let walletId = "0x0000000000000000000000000000000000000000";
  //THis is 2^power something. Forgot the reason.
  let maxDestAmount =
    "5789604500000000000000000000000000000000000000000000000000000000000000000000000000000";
  let value_tx = web3.utils.toWei(qty);
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
        { from: account, gasPrice: "200000000", gas: 300000, value: value_tx },
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

function sell(min, account) {
  let tokenSrc = $("#tokenSourceSell").val();
  let tokenDest = $("#tokenAddressSell").val();
  let qty = $("#amountEntrySell").val();
  let walletId = "0x0000000000000000000000000000000000000000";
  let maxDestAmount =
    "5789604500000000000000000000000000000000000000000000000000000000000000000000000000000";
  let value_tx = web3.utils.toWei(qty);

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
        { from: account, gasPrice: "200000000", gas: 300000, value: value_tx },
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

$(document).ready(function() {
  $("#buy").click(function() {
    var accountPromise = account().then(function(account) {
      return account;
    });
    Promise.all([expectedRateBuy(), accountPromise]).then(function(values) {
      buy(values[0], values[1]).catch(error => console.log(error));
    });
  });

  $("#sell").click(function() {
    var accountPromise = account().then(function(account) {
      return account;
    }); //Why would I need this? what the fuck you were thinking about
    Promise.all([expectedRateSell(), accountPromise]).then(function(values) {
      sell(values[0], values[1]).catch(error => console.log(error));
    });
  });
});
