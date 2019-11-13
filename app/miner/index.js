/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: index.js (Miner class)
 Omschrijving: De miner classe mined alle openstaande transacties in een block
               hiervoor gebruikt de miner een concensus algorithme
*/

const Transaction = require('../transaction');

class Miner {
    constructor({ blockchain, transactionPool, wallet, pubSubManager }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.pubSubManager = pubSubManager;
    }
    
    async mine() {
        const validTransactions = this.transactionPool.validTransactions();

        if (validTransactions.length === 0) return;

        const result = await this.blockchain.addBlock({ data: validTransactions });

        this.pubSubManager.broadcastChain();

        this.transactionPool.clear();
    }
}

module.exports = Miner;