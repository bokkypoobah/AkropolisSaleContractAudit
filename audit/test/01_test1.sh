#!/bin/bash
# ----------------------------------------------------------------------------------------------
# Testing the smart contract
#
# Enjoy. (c) BokkyPooBah / Bok Consulting Pty Ltd 2017. The MIT Licence.
# ----------------------------------------------------------------------------------------------

MODE=${1:-test}

GETHATTACHPOINT=`grep ^IPCFILE= settings.txt | sed "s/^.*=//"`
PASSWORD=`grep ^PASSWORD= settings.txt | sed "s/^.*=//"`

SOURCEDIR=`grep ^SOURCEDIR= settings.txt | sed "s/^.*=//"`

WHITELISTSOL=`grep ^WHITELISTSOL= settings.txt | sed "s/^.*=//"`
WHITELISTJS=`grep ^WHITELISTJS= settings.txt | sed "s/^.*=//"`
TOKENSOL=`grep ^TOKENSOL= settings.txt | sed "s/^.*=//"`
TOKENJS=`grep ^TOKENJS= settings.txt | sed "s/^.*=//"`
CROWDSALESOL=`grep ^CROWDSALESOL= settings.txt | sed "s/^.*=//"`
CROWDSALEJS=`grep ^CROWDSALEJS= settings.txt | sed "s/^.*=//"`

DEPLOYMENTDATA=`grep ^DEPLOYMENTDATA= settings.txt | sed "s/^.*=//"`

INCLUDEJS=`grep ^INCLUDEJS= settings.txt | sed "s/^.*=//"`
TEST1OUTPUT=`grep ^TEST1OUTPUT= settings.txt | sed "s/^.*=//"`
TEST1RESULTS=`grep ^TEST1RESULTS= settings.txt | sed "s/^.*=//"`

CURRENTTIME=`date +%s`
CURRENTTIMES=`date -r $CURRENTTIME -u`

START_DATE=`echo "$CURRENTTIME+30" | bc`
START_DATE_S=`date -r $START_DATE -u`
END_DATE=`echo "$CURRENTTIME+60*1+30" | bc`
END_DATE_S=`date -r $END_DATE -u`
REFUND_END_DATE=`echo "$CURRENTTIME+60*2" | bc`
REFUND_END_DATE_S=`date -r $REFUND_END_DATE -u`

printf "MODE               = '$MODE'\n" | tee $TEST1OUTPUT
printf "GETHATTACHPOINT    = '$GETHATTACHPOINT'\n" | tee -a $TEST1OUTPUT
printf "PASSWORD           = '$PASSWORD'\n" | tee -a $TEST1OUTPUT
printf "SOURCEDIR          = '$SOURCEDIR'\n" | tee -a $TEST1OUTPUT
printf "WHITELISTSOL       = '$WHITELISTSOL'\n" | tee -a $TEST1OUTPUT
printf "WHITELISTJS        = '$WHITELISTJS'\n" | tee -a $TEST1OUTPUT
printf "TOKENSOL           = '$TOKENSOL'\n" | tee -a $TEST1OUTPUT
printf "TOKENJS            = '$TOKENJS'\n" | tee -a $TEST1OUTPUT
printf "CROWDSALESOL       = '$CROWDSALESOL'\n" | tee -a $TEST1OUTPUT
printf "CROWDSALEJS        = '$CROWDSALEJS'\n" | tee -a $TEST1OUTPUT
printf "DEPLOYMENTDATA     = '$DEPLOYMENTDATA'\n" | tee -a $TEST1OUTPUT
printf "INCLUDEJS          = '$INCLUDEJS'\n" | tee -a $TEST1OUTPUT
printf "TEST1OUTPUT        = '$TEST1OUTPUT'\n" | tee -a $TEST1OUTPUT
printf "TEST1RESULTS       = '$TEST1RESULTS'\n" | tee -a $TEST1OUTPUT
printf "CURRENTTIME        = '$CURRENTTIME' '$CURRENTTIMES'\n" | tee -a $TEST1OUTPUT
printf "START_DATE         = '$START_DATE' '$START_DATE_S'\n" | tee -a $TEST1OUTPUT
printf "END_DATE           = '$END_DATE' '$END_DATE_S'\n" | tee -a $TEST1OUTPUT
printf "REFUND_END_DATE    = '$REFUND_END_DATE' '$REFUND_END_DATE_S'\n" | tee -a $TEST1OUTPUT

# Make copy of SOL file and modify start and end times ---
# `cp modifiedContracts/SnipCoin.sol .`
`cp $SOURCEDIR/*.sol .`
`cp -rp ../openzeppelin-contracts/* .`

# --- Modify parameters ---
`perl -pi -e "s/zeppelin-solidity\/contracts\///" *.sol`
`perl -pi -e "s/ROUND_DURATION \= 3 days;/ROUND_DURATION \= 10 seconds;/" *.sol`
`perl -pi -e "s/Whitelist whitelist;/Whitelist public whitelist;/" *.sol`
`perl -pi -e "s/SaleConfiguration config;/SaleConfiguration public config;/" *.sol`
`perl -pi -e "s/MAX_TIER_2 \= 5 ether;/MAX_TIER_2 \= 1000 ether;/" *.sol`
`perl -pi -e "s/MAX_TIER_3 \= 3 ether;/MAX_TIER_3 \= 10000 ether;/" *.sol`
`perl -pi -e "s/mapping\(address \=\> Allocation\) allocations;/mapping\(address \=\> Allocation\) public allocations;/" *.sol`

for FILE in *.sol
do
  DIFFS1=`diff $SOURCEDIR/$FILE $FILE`
  echo "--- Differences $SOURCEDIR/$FILE $FILE ---" | tee -a $TEST1OUTPUT
  echo "$DIFFS1" | tee -a $TEST1OUTPUT
done

solc_0.4.18 --version | tee -a $TEST1OUTPUT

echo "var whitelistOutput=`solc_0.4.18 --optimize --pretty-json --combined-json abi,bin,interface $WHITELISTSOL`;" > $WHITELISTJS
echo "var tokenOutput=`solc_0.4.18 --optimize --pretty-json --combined-json abi,bin,interface $TOKENSOL`;" > $TOKENJS
echo "var crowdsaleOutput=`solc_0.4.18 --optimize --pretty-json --combined-json abi,bin,interface $CROWDSALESOL`;" > $CROWDSALEJS

geth --verbosity 3 attach $GETHATTACHPOINT << EOF | tee -a $TEST1OUTPUT
loadScript("$WHITELISTJS");
loadScript("$TOKENJS");
loadScript("$CROWDSALEJS");
loadScript("functions.js");

var whitelistAbi = JSON.parse(whitelistOutput.contracts["$WHITELISTSOL:Whitelist"].abi);
var whitelistBin = "0x" + whitelistOutput.contracts["$WHITELISTSOL:Whitelist"].bin;
var tokenAbi = JSON.parse(tokenOutput.contracts["$TOKENSOL:AkropolisToken"].abi);
var tokenBin = "0x" + tokenOutput.contracts["$TOKENSOL:AkropolisToken"].bin;
var crowdsaleAbi = JSON.parse(crowdsaleOutput.contracts["$CROWDSALESOL:AkropolisCrowdsale"].abi);
var crowdsaleBin = "0x" + crowdsaleOutput.contracts["$CROWDSALESOL:AkropolisCrowdsale"].bin;
var configAbi = JSON.parse(crowdsaleOutput.contracts["SaleConfiguration.sol:SaleConfiguration"].abi);
var configBin = "0x" + crowdsaleOutput.contracts["SaleConfiguration.sol:SaleConfiguration"].bin;
var allocationAbi = JSON.parse(crowdsaleOutput.contracts["AllocationsManager.sol:AllocationsManager"].abi);
var allocationBin = "0x" + crowdsaleOutput.contracts["AllocationsManager.sol:AllocationsManager"].bin;
var vestingAbi = JSON.parse(crowdsaleOutput.contracts["LinearTokenVesting.sol:LinearTokenVesting"].abi);

// console.log("DATA: whitelistAbi=" + JSON.stringify(whitelistAbi));
// console.log("DATA: whitelistBin=" + JSON.stringify(whitelistBin));
// console.log("DATA: tokenAbi=" + JSON.stringify(tokenAbi));
// console.log("DATA: tokenBin=" + JSON.stringify(tokenBin));
// console.log("DATA: crowdsaleAbi=" + JSON.stringify(crowdsaleAbi));
// console.log("DATA: crowdsaleBin=" + JSON.stringify(crowdsaleBin));
// console.log("DATA: configAbi=" + JSON.stringify(configAbi));
// console.log("DATA: configBin=" + JSON.stringify(configBin));
// console.log("DATA: allocationAbi=" + JSON.stringify(allocationAbi));
// console.log("DATA: allocationBin=" + JSON.stringify(allocationBin));
// console.log("DATA: vestingAbi=" + JSON.stringify(vestingAbi));


unlockAccounts("$PASSWORD");
printBalances();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var deployAllocationsMessage = "Deploy Allocation Contracts";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + deployAllocationsMessage + " ----------");
var allocationContract = web3.eth.contract(allocationAbi);
var presaleAllocationTx = null;
var teamAllocationTx = null;
var advisorAllocationTx = null;
var presaleAllocationAddress = null;
var teamAllocationAddress = null;
var advisorAllocationAddress = null;
var presaleAllocation = allocationContract.new({from: contractOwnerAccount, data: allocationBin, gas: 6000000, gasPrice: defaultGasPrice},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        presaleAllocationTx = contract.transactionHash;
      } else {
        presaleAllocationAddress = contract.address;
        addAccount(presaleAllocationAddress, "Presale Allocation Manager");
        console.log("DATA: presaleAllocationAddress=" + presaleAllocationAddress);
      }
    }
  }
);
var teamAllocation = allocationContract.new({from: contractOwnerAccount, data: allocationBin, gas: 6000000, gasPrice: defaultGasPrice},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        teamAllocationTx = contract.transactionHash;
      } else {
        teamAllocationAddress = contract.address;
        addAccount(teamAllocationAddress, "Team Allocation Manager");
        console.log("DATA: teamAllocationAddress=" + teamAllocationAddress);
      }
    }
  }
);
var advisorAllocation = allocationContract.new({from: contractOwnerAccount, data: allocationBin, gas: 6000000, gasPrice: defaultGasPrice},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        advisorAllocationTx = contract.transactionHash;
      } else {
        advisorAllocationAddress = contract.address;
        addAccount(advisorAllocationAddress, "Advisor Allocation Manager");
        console.log("DATA: advisorAllocationAddress=" + advisorAllocationAddress);
      }
    }
  }
);
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(presaleAllocationTx, deployAllocationsMessage + " - Presale Allocation Manager");
failIfTxStatusError(teamAllocationTx, deployAllocationsMessage + " - Team Allocation Manager");
failIfTxStatusError(advisorAllocationTx, deployAllocationsMessage + " - Advisor Allocation Manager");
printTxData("presaleAllocationAddress=" + presaleAllocationAddress, presaleAllocationTx);
printTxData("teamAllocationAddress=" + teamAllocationAddress, teamAllocationTx);
printTxData("advisorAllocationAddress=" + advisorAllocationAddress, advisorAllocationTx);
printAllocationContractDetails("presale", presaleAllocationAddress, allocationAbi, false);
printAllocationContractDetails("team", teamAllocationAddress, allocationAbi, false);
printAllocationContractDetails("advisor", advisorAllocationAddress, allocationAbi, true);
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var deployWhitelistMessage = "Deploy Whitelist Contract";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + deployWhitelistMessage + " ----------");
var whitelistContract = web3.eth.contract(whitelistAbi);
var whitelistTx = null;
var whitelistAddress = null;
var whitelist = whitelistContract.new({from: contractOwnerAccount, data: whitelistBin, gas: 6000000, gasPrice: defaultGasPrice},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        whitelistTx = contract.transactionHash;
      } else {
        whitelistAddress = contract.address;
        addAccount(whitelistAddress, "Whitelist Contract");
        addWhitelistContractAddressAndAbi(whitelistAddress, whitelistAbi);
        console.log("DATA: whitelistAddress=" + whitelistAddress);
      }
    }
  }
);
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(whitelistTx, deployWhitelistMessage);
printTxData("whitelistAddress=" + whitelistAddress, whitelistTx);
printWhitelistContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var setWhitelistAdmin_Message = "Set Whitelist Admin";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + setWhitelistAdmin_Message + " ----------");
var setWhitelistAdmin_1Tx = whitelist.setAdmin(adminAccount, {from: contractOwnerAccount, gas: 200000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(setWhitelistAdmin_1Tx, setWhitelistAdmin_Message + " - ac4 admin");
printTxData("setWhitelistAdmin_1Tx", setWhitelistAdmin_1Tx);
printWhitelistContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var whitelistAddress_Message = "Whitelist Address";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + whitelistAddress_Message + " ----------");
var whitelistAddress_1Tx = whitelist.addToWhitelist(account5, 1, {from: adminAccount, gas: 200000, gasPrice: defaultGasPrice});
var whitelistAddress_2Tx = whitelist.addToWhitelist(account6, 2, {from: adminAccount, gas: 200000, gasPrice: defaultGasPrice});
var whitelistAddress_3Tx = whitelist.addToWhitelist(account7, 3, {from: adminAccount, gas: 200000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(whitelistAddress_1Tx, whitelistAddress_Message + " - ac5 T1");
failIfTxStatusError(whitelistAddress_2Tx, whitelistAddress_Message + " - ac6 T2");
failIfTxStatusError(whitelistAddress_3Tx, whitelistAddress_Message + " - ac7 T3");
printTxData("whitelistAddress_1Tx", whitelistAddress_1Tx);
printTxData("whitelistAddress_2Tx", whitelistAddress_2Tx);
printTxData("whitelistAddress_3Tx", whitelistAddress_3Tx);
printWhitelistContractDetails();
console.log("RESULT: ");


// BK 17/03/18 Tested on different positions in the list
if (false) {
// -----------------------------------------------------------------------------
var removeFromWhitelist_Message = "Remove Address From Whitelist #1";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + removeFromWhitelist_Message + " ----------");
var removeFromWhitelist_1Tx = whitelist.removeFromWhitelist(account7, {from: adminAccount, gas: 200000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(removeFromWhitelist_1Tx, removeFromWhitelist_Message + " - remove ac7");
printTxData("removeFromWhitelist_1Tx", removeFromWhitelist_1Tx);
printWhitelistContractDetails();
console.log("RESULT: ");

// -----------------------------------------------------------------------------
var removeFromWhitelist_Message = "Remove Address From Whitelist #2";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + removeFromWhitelist_Message + " ----------");
var removeFromWhitelist_1Tx = whitelist.removeFromWhitelist(account5, {from: adminAccount, gas: 200000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(removeFromWhitelist_1Tx, removeFromWhitelist_Message + " - remove ac5");
printTxData("removeFromWhitelist_1Tx", removeFromWhitelist_1Tx);
printWhitelistContractDetails();
console.log("RESULT: ");

// -----------------------------------------------------------------------------
var removeFromWhitelist_Message = "Remove Address From Whitelist #3";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + removeFromWhitelist_Message + " ----------");
var removeFromWhitelist_1Tx = whitelist.removeFromWhitelist(account6, {from: adminAccount, gas: 200000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(removeFromWhitelist_1Tx, removeFromWhitelist_Message + " - remove ac6");
printTxData("removeFromWhitelist_1Tx", removeFromWhitelist_1Tx);
printWhitelistContractDetails();
console.log("RESULT: ");
}


// -----------------------------------------------------------------------------
var deployConfigMessage = "Deploy Config Contract";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + deployConfigMessage + " ----------");
var configContract = web3.eth.contract(configAbi);
var configTx = null;
var configAddress = null;
var config = configContract.new({from: contractOwnerAccount, data: configBin, gas: 6000000, gasPrice: defaultGasPrice},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        configTx = contract.transactionHash;
      } else {
        configAddress = contract.address;
        addAccount(configAddress, "Config Contract");
        addConfigContractAddressAndAbi(configAddress, configAbi);
        console.log("DATA: configAddress=" + configAddress);
      }
    }
  }
);
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(configTx, deployConfigMessage);
printTxData("configAddress=" + configAddress, configTx);
printConfigContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var crowdsaleMessage = "Deploy Crowdsale Contract";
var startTime = parseInt(new Date()/1000) + 10;
var endTime = parseInt(startTime) + 30;
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + crowdsaleMessage + " ----------");
var crowdsaleContract = web3.eth.contract(crowdsaleAbi);
var crowdsaleTx = null;
var crowdsaleAddress = null;
var tokenAddress = null;
var token = null;
var crowdsale = crowdsaleContract.new(startTime, endTime, wallet, whitelistAddress, configAddress, {from: contractOwnerAccount, data: crowdsaleBin, gas: 6000000, gasPrice: defaultGasPrice},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        crowdsaleTx = contract.transactionHash;
      } else {
        crowdsaleAddress = contract.address;
        addAccount(crowdsaleAddress, "Crowdsale Contract");
        addCrowdsaleContractAddressAndAbi(crowdsaleAddress, crowdsaleAbi);
        console.log("DATA: crowdsaleAddress=" + crowdsaleAddress);
        tokenAddress = crowdsale.token();
        token = eth.contract(tokenAbi).at(tokenAddress);
        addAccount(tokenAddress, "Token '" + token.symbol() + "' '" + token.name() + "'");
        addTokenContractAddressAndAbi(tokenAddress, tokenAbi);
      }
    }
  }
);
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(crowdsaleTx, crowdsaleMessage);
printTxData("crowdsaleAddress=" + crowdsaleAddress, crowdsaleTx);
printCrowdsaleContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


waitUntil("startTime", crowdsale.startTime(), 0);


// -----------------------------------------------------------------------------
var sendContribution0Message = "Send Contribution #0 - First Round";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + sendContribution0Message + " ----------");
var sendContribution0_1Tx = eth.sendTransaction({from: account5, to: crowdsaleAddress, gas: 400000, value: web3.toWei("3", "ether")});
var sendContribution0_2Tx = eth.sendTransaction({from: account6, to: crowdsaleAddress, gas: 400000, value: web3.toWei("3", "ether")});
var sendContribution0_3Tx = eth.sendTransaction({from: account7, to: crowdsaleAddress, gas: 400000, value: web3.toWei("3", "ether")});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(sendContribution0_1Tx, sendContribution0Message + " - ac5 3 ETH");
passIfTxStatusError(sendContribution0_2Tx, sendContribution0Message + " - ac6 3 ETH - Expecting failure - wrong round");
passIfTxStatusError(sendContribution0_3Tx, sendContribution0Message + " - ac7 3 ETH - Expecting failure - wrong round");
printTxData("sendContribution0_1Tx", sendContribution0_1Tx);
printTxData("sendContribution0_2Tx", sendContribution0_2Tx);
printTxData("sendContribution0_3Tx", sendContribution0_3Tx);
printCrowdsaleContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


waitUntil("startTime+10s", crowdsale.startTime(), 10);


// -----------------------------------------------------------------------------
var sendContribution1Message = "Send Contribution #1 - Next Round";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + sendContribution1Message + " ----------");
var sendContribution1_1Tx = eth.sendTransaction({from: account5, to: crowdsaleAddress, gas: 400000, value: web3.toWei("2", "ether")});
var sendContribution1_2Tx = eth.sendTransaction({from: account6, to: crowdsaleAddress, gas: 400000, value: web3.toWei("2", "ether")});
var sendContribution1_3Tx = eth.sendTransaction({from: account7, to: crowdsaleAddress, gas: 400000, value: web3.toWei("2", "ether")});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(sendContribution1_1Tx, sendContribution1Message + " - ac5 2 ETH");
failIfTxStatusError(sendContribution1_2Tx, sendContribution1Message + " - ac6 2 ETH");
passIfTxStatusError(sendContribution1_3Tx, sendContribution1Message + " - ac7 2 ETH - Expecting failure - wrong round");
printTxData("sendContribution1_1Tx", sendContribution1_1Tx);
printTxData("sendContribution1_2Tx", sendContribution1_2Tx);
printTxData("sendContribution1_3Tx", sendContribution1_3Tx);
printCrowdsaleContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


waitUntil("startTime+20s", crowdsale.startTime(), 20);


// -----------------------------------------------------------------------------
var sendContribution2Message = "Send Contribution #2 - Next Round";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + sendContribution2Message + " ----------");
var sendContribution2_1Tx = eth.sendTransaction({from: account5, to: crowdsaleAddress, gas: 400000, value: web3.toWei("5", "ether")});
var sendContribution2_2Tx = eth.sendTransaction({from: account6, to: crowdsaleAddress, gas: 400000, value: web3.toWei("500", "ether")});
var sendContribution2_3Tx = eth.sendTransaction({from: account7, to: crowdsaleAddress, gas: 400000, value: web3.toWei("5488", "ether")});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(sendContribution2_1Tx, sendContribution2Message + " - ac5 5 ETH");
failIfTxStatusError(sendContribution2_2Tx, sendContribution2Message + " - ac6 500 ETH");
failIfTxStatusError(sendContribution2_3Tx, sendContribution2Message + " - ac7 5488 ETH");
printTxData("sendContribution2_1Tx", sendContribution2_1Tx);
printTxData("sendContribution2_2Tx", sendContribution2_2Tx);
printTxData("sendContribution2_3Tx", sendContribution2_3Tx);
printCrowdsaleContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var setupAllocationAddress_Message = "Setup Allocation";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + setupAllocationAddress_Message + " ----------");
var setupAllocationAddress_1Tx = presaleAllocation.setAdmin(adminAccount, {from: contractOwnerAccount, gas: 200000, gasPrice: defaultGasPrice});
var setupAllocationAddress_2Tx = teamAllocation.setAdmin(adminAccount, {from: contractOwnerAccount, gas: 200000, gasPrice: defaultGasPrice});
var setupAllocationAddress_3Tx = advisorAllocation.setAdmin(adminAccount, {from: contractOwnerAccount, gas: 200000, gasPrice: defaultGasPrice});
var setupAllocationAddress_4Tx = presaleAllocation.setToken(tokenAddress, {from: contractOwnerAccount, gas: 200000, gasPrice: defaultGasPrice});
var setupAllocationAddress_5Tx = teamAllocation.setToken(tokenAddress, {from: contractOwnerAccount, gas: 200000, gasPrice: defaultGasPrice});
var setupAllocationAddress_6Tx = advisorAllocation.setToken(tokenAddress, {from: contractOwnerAccount, gas: 200000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
var setupAllocationAddress_7Tx = teamAllocation.registerAllocation(team1Account, new BigNumber("100").shift(18), new BigNumber("50").shift(18), 1, 60, {from: adminAccount, gas: 200000, gasPrice: defaultGasPrice});
var setupAllocationAddress_8Tx = teamAllocation.registerAllocation(team2Account, new BigNumber("200").shift(18), new BigNumber("150").shift(18), 60, 240, {from: adminAccount, gas: 200000, gasPrice: defaultGasPrice});
var setupAllocationAddress_9Tx = teamAllocation.registerAllocation(team3Account, new BigNumber("300").shift(18), new BigNumber("250").shift(18), 60, 240, {from: adminAccount, gas: 200000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(setupAllocationAddress_1Tx, setupAllocationAddress_Message + " - Presale setAdmin");
failIfTxStatusError(setupAllocationAddress_2Tx, setupAllocationAddress_Message + " - Team setAdmin");
failIfTxStatusError(setupAllocationAddress_3Tx, setupAllocationAddress_Message + " - Advisor setAdmin");
failIfTxStatusError(setupAllocationAddress_4Tx, setupAllocationAddress_Message + " - Presale setToken");
failIfTxStatusError(setupAllocationAddress_5Tx, setupAllocationAddress_Message + " - Team setToken");
failIfTxStatusError(setupAllocationAddress_6Tx, setupAllocationAddress_Message + " - Advisor setToken");
failIfTxStatusError(setupAllocationAddress_7Tx, setupAllocationAddress_Message + " - teamAllocation.registerAllocation(team1, value=100, vestingValue=50, cliff=1, vesting=240)");
failIfTxStatusError(setupAllocationAddress_8Tx, setupAllocationAddress_Message + " - teamAllocation.registerAllocation(team2, value=200, vestingValue=150, cliff=60, vesting=240)");
failIfTxStatusError(setupAllocationAddress_9Tx, setupAllocationAddress_Message + " - teamAllocation.registerAllocation(team3, value=300, vestingValue=250, cliff=60, vesting=240)");
printTxData("setupAllocationAddress_1Tx", setupAllocationAddress_1Tx);
printTxData("setupAllocationAddress_2Tx", setupAllocationAddress_2Tx);
printTxData("setupAllocationAddress_3Tx", setupAllocationAddress_3Tx);
printTxData("setupAllocationAddress_4Tx", setupAllocationAddress_4Tx);
printTxData("setupAllocationAddress_5Tx", setupAllocationAddress_5Tx);
printTxData("setupAllocationAddress_6Tx", setupAllocationAddress_6Tx);
printTxData("setupAllocationAddress_7Tx", setupAllocationAddress_7Tx);
printTxData("setupAllocationAddress_8Tx", setupAllocationAddress_8Tx);
printTxData("setupAllocationAddress_9Tx", setupAllocationAddress_9Tx);
printAllocationContractDetails("presale", presaleAllocationAddress, allocationAbi, false);
printAllocationContractDetails("team", teamAllocationAddress, allocationAbi, false);
printAllocationContractDetails("advisor", advisorAllocationAddress, allocationAbi, true);
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var finalise_Message = "Finalise";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + finalise_Message + " ----------");
var finalise_1Tx = crowdsale.setPresaleAllocations(presaleAllocationAddress, {from: contractOwnerAccount, gas: 500000, gasPrice: defaultGasPrice});
var finalise_2Tx = crowdsale.setTeamAllocations(teamAllocationAddress, {from: contractOwnerAccount, gas: 500000, gasPrice: defaultGasPrice});
var finalise_3Tx = crowdsale.setAdvisorsAllocations(advisorAllocationAddress, {from: contractOwnerAccount, gas: 500000, gasPrice: defaultGasPrice});
var finalise_4Tx = crowdsale.setReserveFund(reserveFundAccount, {from: contractOwnerAccount, gas: 500000, gasPrice: defaultGasPrice});
var finalise_5Tx = crowdsale.setDevelopmentFund(developmentFundAccount, {from: contractOwnerAccount, gas: 500000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
var finalise_6Tx = crowdsale.finalize({from: contractOwnerAccount, gas: 500000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(finalise_1Tx, finalise_Message + " - setPresaleAllocations");
failIfTxStatusError(finalise_2Tx, finalise_Message + " - setTeamAllocations");
failIfTxStatusError(finalise_3Tx, finalise_Message + " - setAdvisorsAllocations");
failIfTxStatusError(finalise_4Tx, finalise_Message + " - setReserveFund");
failIfTxStatusError(finalise_5Tx, finalise_Message + " - setDevelopmentFund");
failIfTxStatusError(finalise_6Tx, finalise_Message + " - Finalise");
printTxData("finalise_1Tx", finalise_1Tx);
printTxData("finalise_2Tx", finalise_2Tx);
printTxData("finalise_3Tx", finalise_3Tx);
printTxData("finalise_4Tx", finalise_4Tx);
printTxData("finalise_5Tx", finalise_5Tx);
printTxData("finalise_6Tx", finalise_6Tx);
printCrowdsaleContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var distributeVesting_Message = "Distribute Vesting";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + distributeVesting_Message + " ----------");
var distributeVesting_1Tx = teamAllocation.distributeAllocation(team1Account, {from: contractOwnerAccount, gas: 1000000, gasPrice: defaultGasPrice});
var distributeVesting_2Tx = teamAllocation.distributeAllocation(team2Account, {from: contractOwnerAccount, gas: 1000000, gasPrice: defaultGasPrice});
var distributeVesting_3Tx = teamAllocation.distributeAllocation(team3Account, {from: contractOwnerAccount, gas: 1000000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(distributeVesting_1Tx, distributeVesting_Message + " - teamAllocation.distributeAllocation(team1Account)");
failIfTxStatusError(distributeVesting_2Tx, distributeVesting_Message + " - teamAllocation.distributeAllocation(team2Account)");
failIfTxStatusError(distributeVesting_3Tx, distributeVesting_Message + " - teamAllocation.distributeAllocation(team3Account)");
printTxData("distributeVesting_1Tx", distributeVesting_1Tx);
printTxData("distributeVesting_2Tx", distributeVesting_2Tx);
printTxData("distributeVesting_3Tx", distributeVesting_3Tx);
printAllocationContractDetails("team", teamAllocationAddress, allocationAbi, true);
printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var transfer1_Message = "Move Tokens";
// -----------------------------------------------------------------------------
console.log("RESULT: " + transfer1_Message);
var transfer1_1Tx = token.transfer(account8, "1000000000000", {from: account5, gas: 100000, gasPrice: defaultGasPrice});
var transfer1_2Tx = token.approve(account9,  "30000000000000000", {from: account6, gas: 100000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
var transfer1_3Tx = token.transferFrom(account6, eth.accounts[10], "30000000000000000", {from: account9, gas: 100000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
printTxData("transfer1_1Tx", transfer1_1Tx);
printTxData("transfer1_2Tx", transfer1_2Tx);
printTxData("transfer1_3Tx", transfer1_3Tx);
failIfTxStatusError(transfer1_1Tx, transfer1_Message + " - transfer 0.000001 tokens ac5 -> ac8. CHECK for movement");
failIfTxStatusError(transfer1_2Tx, transfer1_Message + " - approve 0.03 tokens ac6 -> ac9");
failIfTxStatusError(transfer1_3Tx, transfer1_Message + " - transferFrom 0.03 tokens ac6 -> ac10 by ac9. CHECK for movement");
printCrowdsaleContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var claimVesting0_Message = "Claim Vesting #1";
var team1VestingContractAddress = teamAllocation.getVesting(team1Account);
var team1VestingContract = eth.contract(vestingAbi).at(team1VestingContractAddress);
addAccount(team1VestingContractAddress, "Team #1 Vesting Contract");
var team2VestingContractAddress = teamAllocation.getVesting(team2Account);
addAccount(team2VestingContractAddress, "Team #2 Vesting Contract");
var team3VestingContractAddress = teamAllocation.getVesting(team3Account);
addAccount(team3VestingContractAddress, "Team #3 Vesting Contract");
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + claimVesting0_Message + " ----------");
var claimVesting0_1Tx = team1VestingContract.release({from: team1Account, gas: 1000000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(claimVesting0_1Tx, claimVesting0_Message + " - team1VestingContract.release()");
printTxData("claimVesting0_1Tx", claimVesting0_1Tx);
printAllocationContractDetails("team", teamAllocationAddress, allocationAbi, true);
printVestingContractDetails(team1VestingContractAddress, vestingAbi, true);
printTokenContractDetails();
console.log("RESULT: ");


waitUntil("vesting.start+30s", team1VestingContract.start(), 30);


// -----------------------------------------------------------------------------
var claimVesting1_Message = "Claim Vesting #2";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + claimVesting1_Message + " ----------");
var claimVesting1_1Tx = team1VestingContract.release({from: team1Account, gas: 1000000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(claimVesting1_1Tx, claimVesting1_Message + " - team1VestingContract.release()");
printTxData("claimVesting1_1Tx", claimVesting1_1Tx);
printAllocationContractDetails("team", teamAllocationAddress, allocationAbi, true);
printVestingContractDetails(team1VestingContractAddress, vestingAbi, true);
printTokenContractDetails();
console.log("RESULT: ");


waitUntil("vesting.start+45s", team1VestingContract.start(), 45);


// -----------------------------------------------------------------------------
var claimVesting2_Message = "Claim Vesting #3";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + claimVesting2_Message + " ----------");
var claimVesting2_1Tx = team1VestingContract.release({from: team1Account, gas: 1000000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(claimVesting2_1Tx, claimVesting2_Message + " - team1VestingContract.release()");
printTxData("claimVesting2_1Tx", claimVesting2_1Tx);
printAllocationContractDetails("team", teamAllocationAddress, allocationAbi, true);
printVestingContractDetails(team1VestingContractAddress, vestingAbi, true);
printTokenContractDetails();
console.log("RESULT: ");


waitUntil("vesting.start+60s", team1VestingContract.start(), 60);


// -----------------------------------------------------------------------------
var claimVesting3_Message = "Claim Vesting #4";
// -----------------------------------------------------------------------------
console.log("RESULT: ---------- " + claimVesting3_Message + " ----------");
var claimVesting3_1Tx = team1VestingContract.release({from: team1Account, gas: 1000000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(claimVesting3_1Tx, claimVesting3_Message + " - team1VestingContract.release()");
printTxData("claimVesting3_1Tx", claimVesting3_1Tx);
printAllocationContractDetails("team", teamAllocationAddress, allocationAbi, true);
printVestingContractDetails(team1VestingContractAddress, vestingAbi, true);
printTokenContractDetails();
console.log("RESULT: ");


EOF
grep "DATA: " $TEST1OUTPUT | sed "s/DATA: //" > $DEPLOYMENTDATA
cat $DEPLOYMENTDATA
grep "RESULT: " $TEST1OUTPUT | sed "s/RESULT: //" > $TEST1RESULTS
cat $TEST1RESULTS
