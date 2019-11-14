/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: block.js (Block class)
 Omschrijving: De block classe bevat alle functionaliteit om een block te genereren, te minen
               en het 'proof of work' algorithme
*/

const hexToBinary = require('hex-to-binary');
const { GENESISBLOCK, MINEDURATION } = require('../config');
const { hasher } = require('../crypto');

class Block {
    constructor({ hash, lastHash, nonce, difficulty, data, timestamp }) {
        this.hash = hash;
        this.lastHash = lastHash;
        this.nonce = nonce;
        this.difficulty = difficulty;
        this.data = data;
        this.timestamp = timestamp;
    }

    static generateGenesisBlock() {
        return new this(GENESISBLOCK);
    }

    static mineBlock({ lastBlock, data }) {
        let hash, timestamp;
        let nonce = 0;
        let newDifficulty = lastBlock.difficulty;
        const lastHash = lastBlock.hash;

        // CONCENSUS ALGORITHME
        // genereer een HASH met O(difficulty) aantal voorloop nullen
        do {
            nonce++;
            timestamp = Date.now();
            newDifficulty = Block.updateDifficulty({ lastBlock, timestamp});
            hash = hasher(lastHash, newDifficulty, nonce, data, timestamp);
        } while (hexToBinary(hash).substring(0, newDifficulty) !== '0'.repeat(newDifficulty));
        
        return new this({ hash, lastHash, difficulty: newDifficulty, nonce, data, timestamp });
    }

    static updateDifficulty({ lastBlock, timestamp }) {
        const difficulty = lastBlock.difficulty;
        if (difficulty < 1) {
            return 1;
        }
        if ((timestamp - lastBlock.timestamp) > MINEDURATION) {
            return difficulty - 1;
        }
        return difficulty + 1;
    }
}

module.exports = Block;