/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: index.js (Main Blockchain class)
 Omschrijving: Blockchain class, implementeert het gedrag van de Blockchain
*/
const Block = require('./block');
const Wallet = require('../wallet')
const Transaction = require('../transaction');
const PersistenceStore = require('../persistence');

const { hasher } = require('../crypto');

class Blockchain {
    constructor() {
        this.chain = [Block.generateGenesisBlock()];
        this.persistence = new PersistenceStore();
        this.persistence.fetchAll({ endingKey: '', index: 0 })
            .then(res => {
                console.log('## RESTORING LOCAL CHAIN FROM REDIS ##');
                this.chain.push(res);
            });
    }

    async addBlock({ data }) {
        const lastBlock = this.chain[this.chain.length-1];
        const newBlock = Block.mineBlock({
            lastBlock,
            data
        });

        // Asynchrone functie. Wacht tot uitvoer is voltooid
        await this.persistence.store({newBlock});
        this.chain.push(newBlock);
    }

    updateLocalChain(chain, successCallback) {
        if (chain.length <= this.chain.length) {
            console.error('Locale chain wordt alleen geupdate als de nieuwe chain langer is');
            return;
        }

        if (!Blockchain.isValid(chain)) {
            console.error('Locale chain wordt alleen vervangen als de nieuwe chain geldig is');
            return;
        }

        if (!this.hasValidData({ chain })) {
            console.error('Locale chain wordt alleen vervangen als de chain data geldig is');
            return;
        }

        if (successCallback) successCallback();
        console.log('lokale chain wordt vervangen ', chain);
        this.chain = chain;
    }

    hasValidData({ chain }) {
        for (let i=1; i<chain.length; i++) {
            const block = chain[i];
            const uniqueTransactions = new Set();

            for(let transaction of block.data) {
                if (!Transaction.validTransaction(transaction)) {
                    console.error('Transactie ongeldig');
                    return false;
                }

                const actualKilowatts = Wallet.calculateKilowatts({
                    chain: this.chain,
                    address: transaction.sender.address
                });
                if (transaction.sender.kilowatt !== actualKilowatts) {
                    console.error('Ongeldige kilowatt sender');
                    return false;
                }

                if(uniqueTransactions.has(transaction)) {
                    console.error('Transactie is niet unique, transactie moet uniek zijn.');
                    return false;
                } else {
                    uniqueTransactions.add(transaction);
                }
            }

        }
        return true;
    }

    static isValid(chain) {
        /**
         * Validation rule: 1
         * Eerste block MOET een genesis block zijn?
         */
        if (JSON.stringify(Block.generateGenesisBlock()) !== JSON.stringify(chain[0])) {
            return false;
        };

        // LOOP over ALLE blocks in the CHAIN
        for (let i = 1; i < chain.length; i++) {
            const { hash, lastHash, nonce, difficulty, data, timestamp } = chain[i];

            /**
             * Validation rule: 2
             * Last hash moet de hash zijn van het vorige block?
             */
            const previousBlockHash = chain[i-1].hash;
            if (lastHash !== previousBlockHash) return false;


            /**
             * Validation rule: 3
             * Is de hash van de block ECHT de hash van de block?
             */
            const actualHash = hasher(lastHash, nonce, difficulty, data, timestamp);
            if (hash !== actualHash) return false;

            /**
             * Validation rule: 4
             * Het concensus algorithme DIFFICULTY mag niet met meer dan 1 verspringen?
             */
            const previousDifficulty = chain[i-1].difficulty;
            const diff = Math.abs(previousDifficulty - difficulty);
            if (diff > 1) return false;
        }
        return true;
    }
}

module.exports = Blockchain;