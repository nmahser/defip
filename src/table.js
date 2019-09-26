const fetch = require("node-fetch");

//get prices from kyber api
async function price() {
  let request = await fetch("https://api.kyber.network/api/tokens/pairs");
  let tokensInformation = await request.json();
  let array = Object.values(tokensInformation);
  //create new properties, for dollar and 1eth buys this much.
  array.forEach(all => (all.currentPrice = all.currentPrice.toFixed(6))); // how can you combine this. 1 extra for loop...
  array.forEach(all => (all.lastPrice = all.lastPrice.toFixed(6)));
  let selectedColumns = array.map(
    ({ decimals, baseVolume, quoteVolume, lastTimestamp, ...keep }) => keep
  );

  let final = selectedColumns.map(
    ({
      symbol: Symbol,
      name: Name,
      currentPrice: Buy,
      lastPrice: Sell,
      contractAddress: TokenAddress,
      ...rest
    }) => ({ Symbol, Name, Buy, Sell, TokenAddress, ...rest })
  );
  return final;
}

function generateTable() {
  price().then(function(data) {
    // EXTRACT VALUE FOR HTML HEADER.
    // ('Symbol', 'Name', 'Buy' and 'Sell')
    var col = [];
    for (var i = 0; i < data.length; i++) {
      for (var key in data[i]) {
        if (col.indexOf(key) === -1) {
          col.push(key);
        }
      }
    }
    col.splice(-1, 1);

    // CREATE DYNAMIC TABLE.
    var table = document.createElement("table");

    // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.

    var tr = table.insertRow(-1); // TABLE ROW.

    for (var i = 0; i < col.length; i++) {
      var th = document.createElement("th"); // TABLE HEADER.
      th.innerHTML = col[i];
      tr.appendChild(th);
    }

    // ADD JSON DATA TO THE TABLE AS ROWS.
    for (var i = 0; i < data.length; i++) {
      tr = table.insertRow(-1);

      for (var j = 0; j < col.length; j++) {
        var tabCell = tr.insertCell(-1);
        tabCell.id = "r" + i + "c" + j;
        tabCell.innerHTML = data[i][col[j]];
      }
    }

    for (let i = 1; i < data.length + 1; i++) {
      // Click event listener for buy and sell
      for (let j = 2; j < 3; j++) {
        table.rows[i].cells[j].addEventListener("click", function() {
          var valueBuy = this.textContent;
          document.getElementById("buyPrice").value = valueBuy;

          var tokenAddress = data[i - 1].TokenAddress; //need to start from zero. For some reason, click event counts column name so 0 is column name.
          document.getElementById("tokenAddress").value = tokenAddress;
          document.getElementById("tokenSource").value =
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

          var tokenNameBuy = data[i - 1].Symbol;
          document.getElementById("tokenNameBuy").innerHTML = tokenNameBuy;
        });
      }
      /*data[i].TokenAddress.addEventListener("click",function() {
             var tokenAddress = this.textContent;
             document.getElementById("tokenBuy").value = tokenAddress;
           });*/

      for (var j = 3; j < 4; j++) {
        table.rows[i].cells[j].addEventListener("click", function() {
          var valueSell = this.textContent;
          document.getElementById("sellPrice").value = valueSell;

          var tokenSourceSell = data[i - 1].TokenAddress; //address of the token to be sold
          document.getElementById("tokenSourceSell").value = tokenSourceSell;
          document.getElementById("tokenAddressSell").value =
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

          var tokenNameSell = data[i - 1].Symbol;
          document.getElementById("tokenNameSell").innerHTML = tokenNameSell;
        });
      }
    }

    // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
    var divContainer = document.getElementById("showData");
    divContainer.innerHTML = "";
    divContainer.appendChild(table);
  });
}

$(document).ready(() => generateTable());
