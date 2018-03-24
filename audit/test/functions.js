// 17 Mar 2018 08:45 AEDT from CMC and https://ethgasstation.info/
var ethPriceUSD = 611.45;
var defaultGasPrice = web3.toWei(2, "gwei");

// -----------------------------------------------------------------------------
// Accounts
// -----------------------------------------------------------------------------
var accounts = [];
var accountNames = {};

addAccount(eth.accounts[0], "Account #0 - Miner");
addAccount(eth.accounts[1], "Account #1 - Contract Owner");
addAccount(eth.accounts[2], "Account #2 - Wallet");
addAccount(eth.accounts[3], "Account #3 - Admin");
addAccount(eth.accounts[4], "Account #4 - Not Whitelisted");
addAccount(eth.accounts[5], "Account #5 - Whitelisted T1");
addAccount(eth.accounts[6], "Account #6 - Whitelisted T2");
addAccount(eth.accounts[7], "Account #7 - Whitelisted T3");
addAccount(eth.accounts[8], "Account #8");
addAccount(eth.accounts[9], "Account #9");
addAccount(eth.accounts[10], "Account #10 - Team #1");
addAccount(eth.accounts[11], "Account #11 - Team #2");
addAccount(eth.accounts[12], "Account #12 - Team #3");
addAccount(eth.accounts[13], "Account #13 - ReserveFund");
addAccount(eth.accounts[14], "Account #14 - DevelopmentFund");
// addAccount(eth.accounts[15], "Account #15");
// addAccount(eth.accounts[16], "Account #16");
// addAccount(eth.accounts[17], "Account #17");
// addAccount(eth.accounts[18], "Account #18");
// addAccount(eth.accounts[19], "Account #19");
// addAccount(eth.accounts[20], "Account #20");
// addAccount(eth.accounts[21], "Account #21");
// addAccount(eth.accounts[22], "Account #22");
// addAccount(eth.accounts[23], "Account #23");
// addAccount(eth.accounts[24], "Account #24");
// addAccount(eth.accounts[25], "Account #25");
// addAccount(eth.accounts[26], "Account #26");
// addAccount(eth.accounts[27], "Account #27");
// addAccount(eth.accounts[28], "Account #28");
// addAccount(eth.accounts[29], "Account #29");
// addAccount(eth.accounts[30], "Account #30");
// addAccount(eth.accounts[31], "Account #31");

var minerAccount = eth.accounts[0];
var contractOwnerAccount = eth.accounts[1];
var wallet = eth.accounts[2];
var adminAccount = eth.accounts[3];
var account4 = eth.accounts[4];
var account5 = eth.accounts[5];
var account6 = eth.accounts[6];
var account7 = eth.accounts[7];
var account8 = eth.accounts[8];
var account9 = eth.accounts[9];
var team1Account = eth.accounts[10];
var team2Account = eth.accounts[11];
var team3Account = eth.accounts[12];
var reserveFundAccount = eth.accounts[13];
var developmentFundAccount = eth.accounts[14];

var baseBlock = eth.blockNumber;

function unlockAccounts(password) {
  for (var i = 0; i < eth.accounts.length && i < accounts.length && i < 13; i++) {
    personal.unlockAccount(eth.accounts[i], password, 100000);
    if (i > 0 && eth.getBalance(eth.accounts[i]) == 0) {
      personal.sendTransaction({from: eth.accounts[0], to: eth.accounts[i], value: web3.toWei(1000000, "ether")});
    }
  }
  while (txpool.status.pending > 0) {
  }
  baseBlock = eth.blockNumber;
}

function addAccount(account, accountName) {
  accounts.push(account);
  accountNames[account] = accountName;
}


// -----------------------------------------------------------------------------
// Token Contract
// -----------------------------------------------------------------------------
var tokenContractAddress = null;
var tokenContractAbi = null;

function addTokenContractAddressAndAbi(address, tokenAbi) {
  tokenContractAddress = address;
  tokenContractAbi = tokenAbi;
}


// -----------------------------------------------------------------------------
// Account ETH and token balances
// -----------------------------------------------------------------------------
function printBalances() {
  var token = tokenContractAddress == null || tokenContractAbi == null ? null : web3.eth.contract(tokenContractAbi).at(tokenContractAddress);
  var decimals = token == null ? 18 : token.decimals();
  var i = 0;
  var totalTokenBalance = new BigNumber(0);
  console.log("RESULT:  # Account                                             EtherBalanceChange                          Token Name");
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  accounts.forEach(function(e) {
    var etherBalanceBaseBlock = eth.getBalance(e, baseBlock);
    var etherBalance = web3.fromWei(eth.getBalance(e).minus(etherBalanceBaseBlock), "ether");
    var tokenBalance = token == null ? new BigNumber(0) : token.balanceOf(e).shift(-decimals);
    totalTokenBalance = totalTokenBalance.add(tokenBalance);
    console.log("RESULT: " + pad2(i) + " " + e  + " " + pad(etherBalance) + " " + padToken(tokenBalance, decimals) + " " + accountNames[e]);
    i++;
  });
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  console.log("RESULT:                                                                           " + padToken(totalTokenBalance, decimals) + " Total Token Balances");
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  console.log("RESULT: ");
}

function pad2(s) {
  var o = s.toFixed(0);
  while (o.length < 2) {
    o = " " + o;
  }
  return o;
}

function pad(s) {
  var o = s.toFixed(18);
  while (o.length < 27) {
    o = " " + o;
  }
  return o;
}

function padToken(s, decimals) {
  var o = s.toFixed(decimals);
  var l = parseInt(decimals)+12;
  while (o.length < l) {
    o = " " + o;
  }
  return o;
}


// -----------------------------------------------------------------------------
// Transaction status
// -----------------------------------------------------------------------------
function printTxData(name, txId) {
  var tx = eth.getTransaction(txId);
  var txReceipt = eth.getTransactionReceipt(txId);
  var gasPrice = tx.gasPrice;
  var gasCostETH = tx.gasPrice.mul(txReceipt.gasUsed).div(1e18);
  var gasCostUSD = gasCostETH.mul(ethPriceUSD);
  var block = eth.getBlock(txReceipt.blockNumber);
  console.log("RESULT: " + name + " status=" + txReceipt.status + (txReceipt.status == 0 ? " Failure" : " Success") + " gas=" + tx.gas +
    " gasUsed=" + txReceipt.gasUsed + " costETH=" + gasCostETH + " costUSD=" + gasCostUSD +
    " @ ETH/USD=" + ethPriceUSD + " gasPrice=" + web3.fromWei(gasPrice, "gwei") + " gwei block=" + 
    txReceipt.blockNumber + " txIx=" + tx.transactionIndex + " txId=" + txId +
    " @ " + block.timestamp + " " + new Date(block.timestamp * 1000).toUTCString());
}

function assertEtherBalance(account, expectedBalance) {
  var etherBalance = web3.fromWei(eth.getBalance(account), "ether");
  if (etherBalance == expectedBalance) {
    console.log("RESULT: OK " + account + " has expected balance " + expectedBalance);
  } else {
    console.log("RESULT: FAILURE " + account + " has balance " + etherBalance + " <> expected " + expectedBalance);
  }
}

function failIfTxStatusError(tx, msg) {
  var status = eth.getTransactionReceipt(tx).status;
  if (status == 0) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function passIfTxStatusError(tx, msg) {
  var status = eth.getTransactionReceipt(tx).status;
  if (status == 1) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function gasEqualsGasUsed(tx) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  return (gas == gasUsed);
}

function failIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function passIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: PASS " + msg);
    return 1;
  } else {
    console.log("RESULT: FAIL " + msg);
    return 0;
  }
}

function failIfGasEqualsGasUsedOrContractAddressNull(contractAddress, tx, msg) {
  if (contractAddress == null) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    var gas = eth.getTransaction(tx).gas;
    var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
    if (gas == gasUsed) {
      console.log("RESULT: FAIL " + msg);
      return 0;
    } else {
      console.log("RESULT: PASS " + msg);
      return 1;
    }
  }
}


//-----------------------------------------------------------------------------
// Wait one block
//-----------------------------------------------------------------------------
function waitOneBlock(oldCurrentBlock) {
  while (eth.blockNumber <= oldCurrentBlock) {
  }
  console.log("RESULT: Waited one block");
  console.log("RESULT: ");
  return eth.blockNumber;
}


//-----------------------------------------------------------------------------
// Pause for {x} seconds
//-----------------------------------------------------------------------------
function pause(message, addSeconds) {
  var time = new Date((parseInt(new Date().getTime()/1000) + addSeconds) * 1000);
  console.log("RESULT: Pausing '" + message + "' for " + addSeconds + "s=" + time + " now=" + new Date());
  while ((new Date()).getTime() <= time.getTime()) {
  }
  console.log("RESULT: Paused '" + message + "' for " + addSeconds + "s=" + time + " now=" + new Date());
  console.log("RESULT: ");
}


//-----------------------------------------------------------------------------
//Wait until some unixTime + additional seconds
//-----------------------------------------------------------------------------
function waitUntil(message, unixTime, addSeconds) {
  var t = parseInt(unixTime) + parseInt(addSeconds) + parseInt(1);
  var time = new Date(t * 1000);
  console.log("RESULT: Waiting until '" + message + "' at " + unixTime + "+" + addSeconds + "s=" + time + " now=" + new Date());
  while ((new Date()).getTime() <= time.getTime()) {
  }
  console.log("RESULT: Waited until '" + message + "' at at " + unixTime + "+" + addSeconds + "s=" + time + " now=" + new Date());
  console.log("RESULT: ");
}


//-----------------------------------------------------------------------------
//Wait until some block
//-----------------------------------------------------------------------------
function waitUntilBlock(message, block, addBlocks) {
  var b = parseInt(block) + parseInt(addBlocks);
  console.log("RESULT: Waiting until '" + message + "' #" + block + "+" + addBlocks + "=#" + b + " currentBlock=" + eth.blockNumber);
  while (eth.blockNumber <= b) {
  }
  console.log("RESULT: Waited until '" + message + "' #" + block + "+" + addBlocks + "=#" + b + " currentBlock=" + eth.blockNumber);
  console.log("RESULT: ");
}


//-----------------------------------------------------------------------------
// Token Contract
//-----------------------------------------------------------------------------
var tokenFromBlock = 0;
function printTokenContractDetails() {
  console.log("RESULT: tokenContractAddress=" + tokenContractAddress);
  if (tokenContractAddress != null && tokenContractAbi != null) {
    var contract = eth.contract(tokenContractAbi).at(tokenContractAddress);
    var decimals = contract.decimals();
    console.log("RESULT: token.owner=" + contract.owner());
    console.log("RESULT: token.symbol=" + contract.symbol());
    console.log("RESULT: token.name=" + contract.name());
    console.log("RESULT: token.decimals=" + decimals);
    console.log("RESULT: token.totalSupply=" + contract.totalSupply().shift(-decimals));
    console.log("RESULT: token.mintingFinished=" + contract.mintingFinished());
    console.log("RESULT: token.paused=" + contract.paused());

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferredEvents = contract.OwnershipTransferred({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferredEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferred " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    ownershipTransferredEvents.stopWatching();

    var mintEvents = contract.Mint({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    mintEvents.watch(function (error, result) {
      console.log("RESULT: Mint " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    mintEvents.stopWatching();

    var mintFinishedEvents = contract.MintFinished({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    mintFinishedEvents.watch(function (error, result) {
      console.log("RESULT: MintFinished " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    mintFinishedEvents.stopWatching();

    var pauseEvents = contract.Pause({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    pauseEvents.watch(function (error, result) {
      console.log("RESULT: Pause " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    pauseEvents.stopWatching();

    var unpauseEvents = contract.Unpause({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    unpauseEvents.watch(function (error, result) {
      console.log("RESULT: Unpause " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    unpauseEvents.stopWatching();

    var approvalEvents = contract.Approval({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    approvalEvents.watch(function (error, result) {
      console.log("RESULT: Approval " + i++ + " #" + result.blockNumber + " owner=" + result.args.owner +
        " spender=" + result.args.spender + " value=" + result.args.value.shift(-decimals));
    });
    approvalEvents.stopWatching();

    var transferEvents = contract.Transfer({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    transferEvents.watch(function (error, result) {
      console.log("RESULT: Transfer " + i++ + " #" + result.blockNumber + ": from=" + result.args.from + " to=" + result.args.to +
        " value=" + result.args.value.shift(-decimals));
    });
    transferEvents.stopWatching();

    tokenFromBlock = latestBlock + 1;
  }
}


// -----------------------------------------------------------------------------
// Crowdsale Contract
// -----------------------------------------------------------------------------
var crowdsaleContractAddress = null;
var crowdsaleContractAbi = null;

function addCrowdsaleContractAddressAndAbi(address, crowdsaleAbi) {
  crowdsaleContractAddress = address;
  crowdsaleContractAbi = crowdsaleAbi;
}

var crowdsaleFromBlock = 0;
function printCrowdsaleContractDetails() {
  console.log("RESULT: crowdsaleContractAddress=" + crowdsaleContractAddress);
  if (crowdsaleContractAddress != null && crowdsaleContractAbi != null) {
    var contract = eth.contract(crowdsaleContractAbi).at(crowdsaleContractAddress);
    console.log("RESULT: crowdsale.owner=" + contract.owner());
    console.log("RESULT: crowdsale.token=" + contract.token());
    console.log("RESULT: crowdsale.wallet=" + contract.wallet());
    console.log("RESULT: crowdsale.tokensSold=" + contract.tokensSold() + " " + contract.tokensSold().shift(-18) + " tokens");

    console.log("RESULT: crowdsale.presaleAllocations=" + contract.presaleAllocations());
    console.log("RESULT: crowdsale.teamAllocations=" + contract.teamAllocations());
    console.log("RESULT: crowdsale.advisorsAllocations=" + contract.advisorsAllocations());
    console.log("RESULT: crowdsale.reserveFund=" + contract.reserveFund());
    console.log("RESULT: crowdsale.developmentFund=" + contract.developmentFund());
    console.log("RESULT: crowdsale.config=" + contract.config());
    console.log("RESULT: crowdsale.cap=" + contract.cap() + " " + contract.cap().shift(-18) + " ETH");
    console.log("RESULT: crowdsale.isFinalized=" + contract.isFinalized());
    console.log("RESULT: crowdsale.whitelist=" + contract.whitelist());
    console.log("RESULT: crowdsale.config=" + contract.config());
    console.log("RESULT: crowdsale.min=" + contract.min(0).shift(-18) + "/" + contract.min(1).shift(-18) + "/" + contract.min(2).shift(-18) + "/" + contract.min(3).shift(-18));
    console.log("RESULT: crowdsale.max=" + contract.max(0).shift(-18) + "/" + contract.max(1).shift(-18) + "/" + contract.max(2).shift(-18) + "/" + contract.max(3).shift(-18));
    console.log("RESULT: crowdsale.startTime=" + contract.startTime() + " " + new Date(contract.startTime() * 1000).toUTCString() + " " + new Date(contract.startTime() * 1000).toString());
    console.log("RESULT: crowdsale.round1EndTime=" + contract.round1EndTime() + " " + new Date(contract.round1EndTime() * 1000).toUTCString() + " " + new Date(contract.round1EndTime() * 1000).toString());
    console.log("RESULT: crowdsale.round2EndTime=" + contract.round2EndTime() + " " + new Date(contract.round2EndTime() * 1000).toUTCString() + " " + new Date(contract.round2EndTime() * 1000).toString());
    console.log("RESULT: crowdsale.endTime=" + contract.endTime() + " " + new Date(contract.endTime() * 1000).toUTCString() + " " + new Date(contract.endTime() * 1000).toString());
    console.log("RESULT: crowdsale.roundDuration=" + contract.roundDuration());

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferredEvents = contract.OwnershipTransferred({}, { fromBlock: crowdsaleFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferredEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferred " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    ownershipTransferredEvents.stopWatching();

    var walletChangeEvents = contract.WalletChange({}, { fromBlock: crowdsaleFromBlock, toBlock: latestBlock });
    i = 0;
    walletChangeEvents.watch(function (error, result) {
      console.log("RESULT: WalletChange " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    walletChangeEvents.stopWatching();

    var finalizedEvents = contract.Finalized({}, { fromBlock: crowdsaleFromBlock, toBlock: latestBlock });
    i = 0;
    finalizedEvents.watch(function (error, result) {
      console.log("RESULT: Finalized " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    finalizedEvents.stopWatching();

    crowdsaleFromBlock = latestBlock + 1;
  }
}


// -----------------------------------------------------------------------------
// Whitelist Contract
// -----------------------------------------------------------------------------
var whitelistContractAddress = null;
var whitelistContractAbi = null;

function addWhitelistContractAddressAndAbi(address, whitelistAbi) {
  whitelistContractAddress = address;
  whitelistContractAbi = whitelistAbi;
}

var whitelistFromBlock = 0;
function printWhitelistContractDetails() {
  console.log("RESULT: whitelistContractAddress=" + whitelistContractAddress);
  if (whitelistContractAddress != null && whitelistContractAbi != null) {
    var contract = eth.contract(whitelistContractAbi).at(whitelistContractAddress);
    console.log("RESULT: whitelist.owner=" + contract.owner());
    var whitelistCount = contract.getWhitelistedCount();
    console.log("RESULT: whitelist.getWhitelistedCount=" + whitelistCount);
    for (var i = 0; i < whitelistCount; i++) {
      var address = contract.indexedWhitelist(i);
      var index = contract.whitelist(address);
      var tier = contract.tiers(address);
      console.log("RESULT: whitelist(" + i + ")=" + address + ", index=" + index + ", tier=" + tier);
    }

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferredEvents = contract.OwnershipTransferred({}, { fromBlock: whitelistFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferredEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferred " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    ownershipTransferredEvents.stopWatching();

    var adminChangedEvents = contract.AdminChanged({}, { fromBlock: whitelistFromBlock, toBlock: latestBlock });
    i = 0;
    adminChangedEvents.watch(function (error, result) {
      console.log("RESULT: AdminChanged " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    adminChangedEvents.stopWatching();

    whitelistFromBlock = latestBlock + 1;
  }
}


// -----------------------------------------------------------------------------
// Config Contract
// -----------------------------------------------------------------------------
var configContractAddress = null;
var configContractAbi = null;

function addConfigContractAddressAndAbi(address, configAbi) {
  configContractAddress = address;
  configContractAbi = configAbi;
}

function printConfigContractDetails() {
  console.log("RESULT: configContractAddress=" + configContractAddress);
  if (configContractAddress != null && configContractAbi != null) {
    var contract = eth.contract(configContractAbi).at(configContractAddress);
    console.log("RESULT: config.AET_RATE=" + contract.AET_RATE());
    console.log("RESULT: config.HARD_CAP=" + contract.HARD_CAP() + " " + contract.HARD_CAP().shift(-18) + " ETH");
    console.log("RESULT: config.MAX_ALLOCATION_VALUE=" + contract.MAX_ALLOCATION_VALUE() + " " + contract.MAX_ALLOCATION_VALUE().shift(-18) + " ETH");
    console.log("RESULT: config.TOTAL_SUPPLY=" + contract.TOTAL_SUPPLY() + " " + contract.TOTAL_SUPPLY().shift(-18) + " tokens");
    console.log("RESULT: config.PUBLIC_SALE_SUPPLY=" + contract.PUBLIC_SALE_SUPPLY() + " " + contract.PUBLIC_SALE_SUPPLY().shift(-18) + " tokens");
    console.log("RESULT: config.PRESALE_SUPPLY=" + contract.PRESALE_SUPPLY() + " " + contract.PRESALE_SUPPLY().shift(-18) + " tokens");
    console.log("RESULT: config.TEAM_SUPPLY=" + contract.TEAM_SUPPLY() + " " + contract.TEAM_SUPPLY().shift(-18) + " tokens");
    console.log("RESULT: config.ADVISORS_SUPPLY=" + contract.ADVISORS_SUPPLY() + " " + contract.ADVISORS_SUPPLY().shift(-18) + " tokens");
    console.log("RESULT: config.RESERVE_FUND_VALUE=" + contract.RESERVE_FUND_VALUE() + " " + contract.RESERVE_FUND_VALUE().shift(-18) + " tokens");
    console.log("RESULT: config.DEVELOPMENT_FUND_VALUE=" + contract.DEVELOPMENT_FUND_VALUE() + " " + contract.DEVELOPMENT_FUND_VALUE().shift(-18) + " tokens");

    console.log("RESULT: config.MIN_TIER_1=" + contract.MIN_TIER_1() + " " + contract.MIN_TIER_1().shift(-18) + " ETH");
    console.log("RESULT: config.MAX_TIER_1=" + contract.MAX_TIER_1() + " " + contract.MAX_TIER_1().shift(-18) + " ETH");
    console.log("RESULT: config.MIN_TIER_2=" + contract.MIN_TIER_2() + " " + contract.MIN_TIER_2().shift(-18) + " ETH");
    console.log("RESULT: config.MAX_TIER_2=" + contract.MAX_TIER_2() + " " + contract.MAX_TIER_2().shift(-18) + " ETH");
    console.log("RESULT: config.MIN_TIER_3=" + contract.MIN_TIER_3() + " " + contract.MIN_TIER_3().shift(-18) + " ETH");
    console.log("RESULT: config.MAX_TIER_3=" + contract.MAX_TIER_3() + " " + contract.MAX_TIER_3().shift(-18) + " ETH");

    console.log("RESULT: config.ROUND_DURATION=" + contract.ROUND_DURATION() + " " + contract.ROUND_DURATION()/(60*60*24) + " days");
  }
}


// -----------------------------------------------------------------------------
// Allocation Contract
// -----------------------------------------------------------------------------
var allocationFromBlock = 0;
function printAllocationContractDetails(name, address, abi, updateFromBlock) {
  console.log("RESULT: " + name + "Allocation.address=" + address);
  if (address != null && abi != null) {
    var contract = eth.contract(abi).at(address);
    console.log("RESULT: " + name + "Allocation.owner=" + contract.owner());
    console.log("RESULT: " + name + "Allocation.token=" + contract.token());
    console.log("RESULT: " + name + "Allocation.totalAllocated=" + contract.totalAllocated() + " " + contract.totalAllocated().shift(-18));

    var allocationCount = contract.getAllocationsCount();
    console.log("RESULT: " + name + "Allocation.getAllocationsCount=" + allocationCount);
    for (var i = 0; i < allocationCount; i++) {
      var address = contract.indexedAllocations(i);
      var data = contract.allocations(address);
      console.log("RESULT: " + name + "Allocation.allocations(" + i + ")=" + address + ", " + data);
    }

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferredEvents = contract.OwnershipTransferred({}, { fromBlock: allocationFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferredEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferred(" + name + ") " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    ownershipTransferredEvents.stopWatching();

    var allocationRegisteredEvents = contract.AllocationRegistered({}, { fromBlock: allocationFromBlock, toBlock: latestBlock });
    i = 0;
    allocationRegisteredEvents.watch(function (error, result) {
      console.log("RESULT: AllocationRegistered(" + name + ") " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    allocationRegisteredEvents.stopWatching();

    var allocationDistributedEvents = contract.AllocationDistributed({}, { fromBlock: allocationFromBlock, toBlock: latestBlock });
    i = 0;
    allocationDistributedEvents.watch(function (error, result) {
      console.log("RESULT: AllocationDistributed(" + name + ") " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    allocationDistributedEvents.stopWatching();

    var tokensReclaimedEvents = contract.TokensReclaimed({}, { fromBlock: allocationFromBlock, toBlock: latestBlock });
    i = 0;
    tokensReclaimedEvents.watch(function (error, result) {
      console.log("RESULT: TokensReclaimed(" + name + ") " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    tokensReclaimedEvents.stopWatching();

    if (updateFromBlock) {
      allocationFromBlock = latestBlock + 1;
    }
  }
}


// -----------------------------------------------------------------------------
// Vesting Contract
// -----------------------------------------------------------------------------
var vestingFromBlock = 0;
function printVestingContractDetails(address, abi, updateFromBlock) {
  console.log("RESULT: vesting.address=" + address);
  if (address != null && abi != null) {
    var contract = eth.contract(abi).at(address);
    console.log("RESULT: vesting.owner=" + contract.owner());
    console.log("RESULT: vesting.beneficiary=" + contract.beneficiary());
    console.log("RESULT: vesting.start=" + contract.start() + " " + new Date(contract.start() * 1000).toUTCString() + " " + new Date(contract.start() * 1000).toString());
    console.log("RESULT: vesting.cliff=" + contract.cliff());
    console.log("RESULT: vesting.duration=" + contract.duration());

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferredEvents = contract.OwnershipTransferred({}, { fromBlock: vestingFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferredEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferred " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    ownershipTransferredEvents.stopWatching();

    var releasedEvents = contract.Released({}, { fromBlock: vestingFromBlock, toBlock: latestBlock });
    i = 0;
    releasedEvents.watch(function (error, result) {
      console.log("RESULT: Released " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    releasedEvents.stopWatching();

    if (updateFromBlock) {
      vestingFromBlock = latestBlock + 1;
    }
  }
}


// -----------------------------------------------------------------------------
// Generate Summary JSON
// -----------------------------------------------------------------------------
function generateSummaryJSON() {
  console.log("JSONSUMMARY: {");
  if (crowdsaleContractAddress != null && crowdsaleContractAbi != null) {
    var contract = eth.contract(crowdsaleContractAbi).at(crowdsaleContractAddress);
    var blockNumber = eth.blockNumber;
    var timestamp = eth.getBlock(blockNumber).timestamp;
    console.log("JSONSUMMARY:   \"blockNumber\": " + blockNumber + ",");
    console.log("JSONSUMMARY:   \"blockTimestamp\": " + timestamp + ",");
    console.log("JSONSUMMARY:   \"blockTimestampString\": \"" + new Date(timestamp * 1000).toUTCString() + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleContractAddress\": \"" + crowdsaleContractAddress + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleContractOwnerAddress\": \"" + contract.owner() + "\",");
    console.log("JSONSUMMARY:   \"tokenContractAddress\": \"" + contract.bttsToken() + "\",");
    console.log("JSONSUMMARY:   \"tokenContractDecimals\": " + contract.TOKEN_DECIMALS() + ",");
    console.log("JSONSUMMARY:   \"crowdsaleWalletAddress\": \"" + contract.wallet() + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleTeamWalletAddress\": \"" + contract.teamWallet() + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleTeamPercent\": " + contract.TEAM_PERCENT_GZE() + ",");
    console.log("JSONSUMMARY:   \"bonusListContractAddress\": \"" + contract.bonusList() + "\",");
    console.log("JSONSUMMARY:   \"tier1Bonus\": " + contract.TIER1_BONUS() + ",");
    console.log("JSONSUMMARY:   \"tier2Bonus\": " + contract.TIER2_BONUS() + ",");
    console.log("JSONSUMMARY:   \"tier3Bonus\": " + contract.TIER3_BONUS() + ",");
    var startDate = contract.START_DATE();
    // BK TODO - Remove for production
    startDate = 1512921600;
    var endDate = contract.endDate();
    // BK TODO - Remove for production
    endDate = 1513872000;
    console.log("JSONSUMMARY:   \"crowdsaleStart\": " + startDate + ",");
    console.log("JSONSUMMARY:   \"crowdsaleStartString\": \"" + new Date(startDate * 1000).toUTCString() + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleEnd\": " + endDate + ",");
    console.log("JSONSUMMARY:   \"crowdsaleEndString\": \"" + new Date(endDate * 1000).toUTCString() + "\",");
    console.log("JSONSUMMARY:   \"usdPerEther\": " + contract.usdPerKEther().shift(-3) + ",");
    console.log("JSONSUMMARY:   \"usdPerGze\": " + contract.USD_CENT_PER_GZE().shift(-2) + ",");
    console.log("JSONSUMMARY:   \"gzePerEth\": " + contract.gzePerEth().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"capInUsd\": " + contract.CAP_USD() + ",");
    console.log("JSONSUMMARY:   \"capInEth\": " + contract.capEth().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"minimumContributionEth\": " + contract.MIN_CONTRIBUTION_ETH().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"contributedEth\": " + contract.contributedEth().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"contributedUsd\": " + contract.contributedUsd() + ",");
    console.log("JSONSUMMARY:   \"generatedGze\": " + contract.generatedGze().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"lockedAccountThresholdUsd\": " + contract.lockedAccountThresholdUsd() + ",");
    console.log("JSONSUMMARY:   \"lockedAccountThresholdEth\": " + contract.lockedAccountThresholdEth().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"precommitmentAdjusted\": " + contract.precommitmentAdjusted() + ",");
    console.log("JSONSUMMARY:   \"finalised\": " + contract.finalised());
  }
  console.log("JSONSUMMARY: }");
}