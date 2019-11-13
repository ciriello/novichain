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
const { GENESIS_HASH } = require('../config');
const Synchronizer = require('../sync');

const { hasher } = require('../crypto');
const ROOT_NODE_POORT = 3000;
const ROOT_NODE_ADRES = `http://localhost:${ROOT_NODE_POORT}`; // rootnode url

class Blockchain {
    constructor() {
        this.chain = [];
        this.persistence = new PersistenceStore();
        this.synchronizer = new Synchronizer({ blockchain: this, transactionPool: null });
        this.addGenesisBlock();
        // Haal het laatste block op en kopieer naar het geheugen.
        this.persistence.fetchLast()
            .then(lastBlock => {
                console.log('######### LAST BLOCK ', lastBlock);
                const { hash } = lastBlock;
                if (hash) {
                    this.synchronizer.syncChain({ root_node_address: ROOT_NODE_ADRES, hash });
                }
            })
            .catch(err => {
                console.log('######### LAST BLOCK ERROR ', err);
            });
    }

    addGenesisBlock() {
        const genesis = Block.generateGenesisBlock();
        this.chain = [genesis];
        this.persistence.store({ newBlock: genesis });
    }

    addBlock({ data }) {
        return new Promise((resolve, reject) => {
            this.persistence.fetchLast()
            .then(async lastBlock => {
                const newBlock = Block.mineBlock({
                    lastBlock,
                    data
                });
                this.chain.push(newBlock);
                await this.persistence.store({newBlock});
                resolve(newBlock);
            });
        });
    }

    senderChain({ address }) {
        return this.persistence.fetchByAddress({ address });
    }

    fullChain(lastKnownHash = '') {
        return this.persistence.fetchAll({ endingKey: lastKnownHash });
    }

    lastBlock() {
        return this.persistence.fetchLast();
    }

    updateLocalChain(chain, successCallback) {
        this.fullChain()
            .then(currentChain => {

                console.log('new chain ', chain);

                let toBeChain = [...currentChain];
                toBeChain.push(...chain);

                if (chain.length + currentChain.length <= currentChain.length) {
                    console.error('Lokale chain wordt alleen geupdate als de nieuwe chain langer is');
                    return;
                }

                if (!Blockchain.isValid(toBeChain)) {
                    console.error('Lokale chain wordt alleen vervangen als de nieuwe chain geldig is');
                    return;
                }
        
                if (!this.hasValidData({ chain: toBeChain })) {
                    console.error('Lokale chain wordt alleen vervangen als de chain data geldig is');
                    return;
                }
        
                if (successCallback) successCallback();
                console.log('Lokale chain wordt vervangen ', toBeChain);
                this.chain = chain;
                this.persistence.replace({chain});
            });
    }

    hasValidData({ chain }) {
        const validateChain = [...chain]
        validateChain.push(chain);
        for (let i=1; i<chain.length; i++) {
            const block = validateChain[i];
            const uniqueTransactions = new Set();

            for(let transaction of block.data) {
                if (!Transaction.validTransaction(transaction)) {
                    console.error('Transactie ongeldig');
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
        console.log('start chain validatie');
        /**
         * Validation rule: 1
         * Eerste block MOET een genesis block zijn?
         */
        if (JSON.stringify(Block.generateGenesisBlock()) !== JSON.stringify(chain[0])) {
            return false;
        };
        console.log('validation rule 1 is geldig');

        // LOOP over ALLE blocks in the CHAIN
        for (let i = 1; i < chain.length; i++) {
            const { hash, lastHash, nonce, difficulty, data, timestamp } = chain[i];

            /**
             * Validation rule: 2
             * Last hash moet de hash zijn van het vorige block?
             */
            const previousBlockHash = chain[i-1].hash;
            if (lastHash !== previousBlockHash) return false;
            console.log('validation rule 2 is geldig');

            /**
             * Validation rule: 3
             * Is de hash van de block ECHT de hash van de block?
             */
            const actualHash = hasher(lastHash, nonce, difficulty, data, timestamp);
            if (hash !== actualHash) return false;
            console.log('validation rule 3 is geldig');

            /**
             * Validation rule: 4
             * Het concensus algorithme DIFFICULTY mag niet met meer dan 1 verspringen?
             */
            const previousDifficulty = chain[i-1].difficulty;
            const diff = Math.abs(previousDifficulty - difficulty);
            if (diff > 1) return false;
            console.log('validation rule 4 is geldig');
        }
        return true;
    }
}

module.exports = Blockchain;