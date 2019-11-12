/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: index.js (Wallet)
 Omschrijving: Wallet class is de unique identifier van een gebuiker
               bevat een private en public key om data te signen
*/

const Transaction = require('../transaction');
const { KILOWATT_USAGE } = require('../config');
const { ellipticCurve, hasher } = require('../crypto');

class Wallet {
    constructor() {
        this.router = (req, res, next) => next();
        this.kilowatts = KILOWATT_USAGE;
        this.keyPair = ellipticCurve.genKeyPair();
        this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    sign(data) {
        return this.keyPair.sign(hasher(data));
    }

    createTransaction({ recipient, kilowatt, chain }) {
        if (chain) {
            this.kilowatts = Wallet.calculateKilowatts({
                chain,
                address: this.publicKey
            });
        }

        if (kilowatt > this.kilowatts) {
            throw new Error('Kilowatt exceeds killowatts');
        }

        return new Transaction({ senderWallet: this, recipient, kilowatt });

    }

    static calculateKilowatts({ chain, address }) {
        let hasConductedTransaction = false;
        let outputsTotal = 0;

        for (let i=chain.length-1; i>0; i--) {
            const block = chain[i];

            for (let transaction of block.data) {

                if (transaction.sender.address === address) {
                    hasConductedTransaction = true;
                }

                const addressOutput = transaction.cdrMap[address];

                if(addressOutput) {
                    outputsTotal = outputsTotal + addressOutput;
                }
            }

            if (hasConductedTransaction) {
                break;
            }
        }

        return hasConductedTransaction ? outputsTotal : KILOWATT_USAGE + outputsTotal;
    }
}

module.exports = Wallet;