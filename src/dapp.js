var Web3 = require("web3");
var contract = require("truffle-contract");
var Whitelist = contract(require("../build/contracts/Whitelist.json"));
var Allocations = contract(require("../build/contracts/AllocationsManager.json"));
var axios = require('axios');

require("bootstrap");
var deployedContracts = require('../migrations-sale/before-sale-deployment.json');

var allocationsMode = "Presale";

var teamAllocation = Allocations.at(deployedContracts.TeamAllocations);
var advisorsAllocation = Allocations.at(deployedContracts.AdvisorsAllocations);
var presaleAllocation = Allocations.at(deployedContracts.PresaleAllocations);

var connectedWhitelist = Whitelist.at(deployedContracts.Whitelist);

function show(element, text) {
	var element = document.getElementById(element);
	if (element) {
		element.innerHTML = text;
	}
}

duration = {
	seconds: function (val) { return val; },
	minutes: function (val) { return val * this.seconds(60); },
	hours: function (val) { return val * this.minutes(60); },
	days: function (val) { return val * this.hours(24); },
	weeks: function (val) { return val * this.days(7); },
	years: function (val) { return val * this.days(365); },
};

function etherToWei (n) {
	return new web3.BigNumber(web3.toWei(n, 'ether'));
}

function weiToEther (n) {
	return new web3.BigNumber(web3.fromWei(n, 'ether'));
}



window.Dapp = {
	allocations: {},

	start: function() {
		this.setWhitelistedCount();
		this.setAllocationsSummary();
		this.listAllAllocations();
		var element = document.getElementById("allocation_title");
		if(element!=null) {
			element.innerHTML = "<h1>" + allocationsMode + " Allocations</h1>";
		}
	},

	setAlert: function(message, type) {
		type = type || "info";
		var element = document.getElementById("alerts");
		element.innerHTML = "<div class='alert alert-" + type + "'>" + message + "</div>";
	},

	setPresaleAllocations: function(){
		allocationsMode = "Presale";
		this.start();
	},

	setTeamAllocations: function(){
		allocationsMode = "Team";
		this.start();
	},

	setAdvisorsAllocations: function(){
		allocationsMode = "Advisors";
		this.start();
	},


	throwError: function(message, err) {
		err = err || message;
		this.setAlert("<strong>Error!</strong> " + message, "danger");
		throw err;
	},

	setWhitelistedCount: function() {
		return connectedWhitelist.getWhitelistedCount.call().then(function(value) {
			show("whitelisted-count", value.valueOf());
		}).catch(function(err) {
			console.log(err);
		});
	},

	addToWhitelist: function() {
		var self = this;
		var address = document.getElementById("buyer-address").value;
		var tier = document.getElementById("buyer-tier").value;
		self.setAlert("Adding to the whitelist..." + address);
		return connectedWhitelist.addToWhitelist(address,tier, {from: adminAccount}).then(function() {
			self.setWhitelistedCount();
			self.setAlert("Buyer was added!", "success");
		}).catch(function(err) {
			Dapp.throwError("Cannot add to the whitelist!");
			console.log(err);
		});
	},

	removeFromWhitelist: function() {
		var self = this;
		var address = document.getElementById("remove-address").value;
		console.log("Removing from whitelist: " + address);
		self.setAlert("Removing from the whitelist...");
		return connectedWhitelist.removeFromWhitelist(address, {from: adminAccount}).then(function() {
			self.setWhitelistedCount();
			self.setAlert("Buyer was removed!", "success");
		}).catch(function(err) {
			Dapp.throwError("Cannot remove from the whitelist!");
			console.log(err);
		});
	},

	checkAddress: function() {
		var self = this;
		var address = document.getElementById("check-address").value;
		console.log("Checking address: " + address);
		self.setAlert("Checking address...");
		return connectedWhitelist.isWhitelisted(address, {from: adminAccount}).then(function(result) {
			console.log(result);
			if (result) {
				self.setAlert("Address: " + address + " is whitelisted.", "success");
			} else {
				self.setAlert("Address: " + address + " is NOT whitelisted.", "danger");
			}
		}).catch(function(err) {
			Dapp.throwError("Cannot check the address!");
			console.log(err);
		});
	},

	fetchWhitelistedAddress: function(index, max, contract, element) {
		var self = this;
		if (index<max) {
			contract.getWhitelistedAddress(index).then(function (value) {
				contract.getTier(value).then(function(tier) {
					element.innerHTML = element.innerHTML + value + " Tier: "+ tier + "<br/>";
					return self.fetchWhitelistedAddress(index+1, max, contract, element);
				});
			}).catch(function(err) {
				console.log(err);
			});
		}
	},

	listAllWhitelisted: function() {
		var self = this;
		var contract;
		var element = document.getElementById("whitelisted-list");
		element.innerHTML = "";
		contract = connectedWhitelist;
		return connectedWhitelist.getWhitelistedCount.call().then(function(max) {
			return self.fetchWhitelistedAddress(0, max, contract, element);
		}).catch(function(err) {
			console.log(err);
		});
	},

	setAllocationsSummary: function() {
		this.allocations[allocationsMode].totalAllocated().then(function(total){
			show("allocations-total", weiToEther(total).valueOf());
		}).catch(function(err) {
			console.log(err);
		});

		this.allocations[allocationsMode].getAllocationsCount().then(function(count) {
			show("allocations-count", count.valueOf());
		}).catch(function(err) {
			console.log(err);
		});


	},

	addAllocation: function() {
		var self = this;
		var address = document.getElementById("allocation-address").value;
		var value = etherToWei(document.getElementById("allocation-value").value);
		var vestingValue = etherToWei(document.getElementById("allocation-vesting-value").value);
		var vestingCliff = duration.days(document.getElementById("allocation-vesting-cliff").value);
		var vestingPeriod = duration.days(document.getElementById("allocation-vesting-period").value);
		if(vestingCliff > vestingPeriod) {
			Dapp.throwError("The vesting cliff must not be greater than the period of vesting");
		} else {
			console.log("Adding allocation: " + address);
			self.setAlert("Adding allocation...");
			self.allocations[allocationsMode].registerAllocation(address, value, vestingValue, vestingCliff, vestingPeriod, {
				from: adminAccount,
				gas: 200000
			}).then(function (tx) {
				self.setAllocationsSummary();
				self.listAllAllocations();
				self.setAlert("Allocation was added. Transaction hash: " + tx.tx, "success");
			}).catch(function (err) {
				Dapp.throwError("Cannot add allocation!");
				console.log(err);
			});
		}
	},

	findAllocation: function() {
		var self = this;
		var address = document.getElementById("allocation-address").value;
		console.log("Checking address: " + address);
		self.setAlert("Looking for allocation: " + address);
		self.allocations[allocationsMode].getAllocation(address, {from: adminAccount}).then(function(result) {
			console.log(result);
			if (result && result[0].valueOf()>0) {
				self.setAlert("Address: " + address + " has an allocation.", "success");
				document.getElementById("allocation-value").value = weiToEther(result[0].valueOf());
				document.getElementById("allocation-vesting-value").value = weiToEther(result[1].valueOf());
				document.getElementById("allocation-vesting-cliff").value = result[2].valueOf() / duration.days(1);
				document.getElementById("allocation-vesting-period").value = result[3].valueOf() / duration.days(1);
				show("add-update-button", "Update");
			} else {
				self.setAlert("Address: " + address + " has NO allocation.", "danger");
			}
		}).catch(function(err) {
			Dapp.throwError("Cannot check the address!");
			console.log(err);
		});
	},

	fetchAllocation: function(index, max, table) {
		var self = this;
		var address;

		if (index<max) {
			return self.allocations[allocationsMode].getAllocationAddress(index).then(function (value) {
				address = value;
				return self.allocations[allocationsMode].getAllocation(address).then(function (allocation) {
					if(table != null) {
						var row = table.insertRow();
						row.insertCell(0).innerHTML = index;
						row.insertCell(1).innerHTML = address;
						row.insertCell(2).innerHTML = weiToEther(allocation[0]);
						row.insertCell(3).innerHTML = weiToEther(allocation[1]);
						row.insertCell(4).innerHTML = allocation[2].valueOf() / duration.days(1);
						row.insertCell(5).innerHTML = allocation[3].valueOf() / duration.days(1);
					}
					return self.fetchAllocation(index+1, max, table);
				});
			}).catch(function(err) {
				console.log(err);
			});
		}
	},

	listAllAllocations: function() {
		var self = this;
		var table = document.getElementById("allocations-table");
		while (table != null && table.rows.length> 1) {
			table.deleteRow(1);
		}
		self.allocations[allocationsMode].getAllocationsCount().then(function(max) {
			return self.fetchAllocation(0, max.toNumber(), table);
		}).catch(function(err) {
			console.log(err);
		});
	},

	removeAllocation: function() {
		var self = this;
		var address = document.getElementById("allocation-remove-address").value;
		self.setAlert("Removing the allocation " + address);
		self.allocations[allocationsMode].removeAllocation(address, {from: adminAccount}).then(function(tx) {
			console.log(tx);
			self.setAllocationsSummary();
			self.listAllAllocations();
			self.setAlert("Allocation was removed. Transaction hash: " + tx.tx, "success");
		}).catch(function(err) {
			Dapp.throwError("Cannot remove the allocation!");
			console.log(err);
		});
	},

	addBulkAdditionsToWhitelist: function() {
		//This function persists out to the database on a correct response from the smart contract
		var self = this;		
		var rows = document.getElementsByTagName("table")[0].rows;
		var addresses = [];
		var tiers = [];
		for (var i = 1; i < rows.length; i++) //First row is title column, iterate through other rows
		{
			var thisAddress = rows[i].cells[0].innerHTML;
			addresses.push(thisAddress);
			tiers.push(parseInt(document.getElementById('dropdown-tier'+ thisAddress).value));
		}
		console.log("Adding bulk to the whitelist..." + tiers + addresses);
		return connectedWhitelist.addMultipleToWhitelist(addresses,tiers, {from: adminAccount}).then(function(txHash) {
			self.setAlert("Buyers were added!", "success");
			updateDBWhitelist(addresses, tiers)
		}).catch(function(err) {
			Dapp.throwError("There has been an error with the panel, please send developer team link to transaction hash from Metamask");
			console.log(err);
		});

	}
};

window.addEventListener("load", function() {
	if (typeof web3 !== "undefined") {
		window.web3 = new Web3(web3.currentProvider);
	} else {
		window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
	}

	Whitelist.setProvider(web3.currentProvider);
	Allocations.setProvider(web3.currentProvider);

	web3.eth.getAccounts(function(err, accounts) {
		if (err) {
			Dapp.throwError("Your browser can't see the decentralized web!", err);
		}
		if (accounts.length == 0) {
			Dapp.throwError("Connect an account!");
		}
		adminAccount = accounts[0];

		//Set allocations
		Dapp.allocations["Team"] = teamAllocation;
		Dapp.allocations["Advisors"] = advisorsAllocation;
		Dapp.allocations["Presale"] = presaleAllocation;

		Dapp.start();

	});
});

function updateDBWhitelist(addresses, tiers){
//This component will be updated to be handled in the then function above with clarification of connected whitelist call
		if(addresses.length === tiers.length && addresses.length > 0) //Ensure we have 1 to 1 mapping address to tier
		{
			var stringWithAddresses = "'" + addresses[1] + "'";
			for(var j= 2; j < addresses.length; j++)
			{
				stringWithAddresses += "," + "'" + addresses[j] + "'"; //Comma delimited list
			}
			console.log(stringWithAddresses);
			let dataAddresses = {'EthAddresses': addresses};
			axios.post('http://localhost:3000/updateAddedToSmartContractEntries', dataAddresses).then((res) => {
				console.log("Successfully updated db");
			}).catch((err) => {
				console.log("Error pinging api");
			});
		}
}
