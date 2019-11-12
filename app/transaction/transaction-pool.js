/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: transaction-pool.js (Transaction Pool Manager)
 Omschrijving: Transaction Pool managed en valideerd alle actieve transacties, voordat ze gemined
               worden en aan een block kunnen worden toegevoegd
*/

const Transaction = require('.');

class TransactionPool {
    constructor() {
        this.transactionMap = {};
    }

    clear() {
        this.transactionMap = {};
    }

    addTransaction({ chain, wallet, recipient, kilowatt }) {
        let transaction = this.existingTransaction({ senderAddress: wallet.publicKey });
        try {
            if (transaction) {
                transaction.update({ senderWallet: wallet, recipient: recipient, kilowatt });
            } else {
                transaction = wallet.createTransaction({
                    recipient,
                    kilowatt,
                    chain
                });
            }
        } catch (error) {
            throw error;
        }
        this.setTransaction(transaction);
        return transaction;
    }

    setTransaction(transaction) {
        this.transactionMap[transaction.id] = transaction;
    }

    setMap(transactionMap) {
        this.transactionMap = transactionMap;
    }

    existingTransaction({ senderAddress }) {
        const transactions = Object.values(this.transactionMap);

        return transactions.find(transaction => transaction.sender.address === senderAddress);
    }

    validTransactions() {
        return Object.values(this.transactionMap).filter(
            transaction => Transaction.validTransaction(transaction)
        );
    }

    clearBlockchainTransactions({ chain }) {
        for (let i=1; i<chain.length; i++) {
            const block = chain[i];

            for (let transaction of block.data) {
                if (this.transactionMap[transaction.id]) {
                    delete this.transactionMap[transaction.id];
                }
            }
        }
    }
}

module.exports = TransactionPool;