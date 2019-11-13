/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: index.js (Synchronizer)
 Omschrijving: Deze classe wordt gebruikt om een node te synchroniseren bij het opstarten
*/

const request = require('request');

class Synchronizer {
    constructor({ blockchain, transactionPool }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
    }

    sync({ root_node_address }) {
        request({ url: `${root_node_address}/api/blocks` }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                const rootChain = JSON.parse(body);
                this.blockchain.updateLocalChain(rootChain);
            }
        });
    
        request({ url: `${root_node_address}/api/transaction`}, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                const rootTransactionPoolMap = JSON.parse(body);
    
                console.log('replace local transaction pool with incoming transaction pool', rootTransactionPoolMap);
                this.transactionPool.setMap(rootTransactionPoolMap);
            }
        });
    }

    syncChain({ root_node_address, hash }) {
        request({ url: `${root_node_address}/api/blocks/sync/${hash}` }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                const rootChain = JSON.parse(body);
                this.blockchain.updateLocalChain(rootChain);
            }
        });
    }

    syncTransactionPool({ root_node_address, transactionPool }) {
        request({ url: `${root_node_address}/api/transaction`}, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                const rootTransactionPoolMap = JSON.parse(body);
    
                console.log('replace local transaction pool with incoming transaction pool', rootTransactionPoolMap);
                this.transactionPool.setMap(rootTransactionPoolMap);
            }
        });
    }
}

module.exports = Synchronizer;