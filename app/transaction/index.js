/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: index.js (Transaction)
 Omschrijving: De Transaction class. Deze class maakt en valideerd transacties
*/

const uuid = require('uuid/v1');
const { isValidSignature } = require('../crypto');

class Transaction {
    constructor({ senderWallet, recipient, kilowatt, cdrMap, sender }) {
        this.id = uuid();
        this.cdrMap = cdrMap || this.creataCdrMap({ senderWallet, recipient, kilowatt });
        this.sender = sender || this.createSender({ senderWallet, cdrMap: this.cdrMap });
    }

    creataCdrMap({ senderWallet, recipient, kilowatt }) {
        const cdrMap = {};

        cdrMap[recipient] = kilowatt;
        cdrMap[senderWallet.publicKey] = senderWallet.kilowatts - kilowatt;

        return cdrMap;
    }

    createSender({ senderWallet, cdrMap }) {
        return {
            timestamp: Date.now(),
            kilowatt: senderWallet.kilowatts,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(cdrMap)
        };
    }

    update({ senderWallet, recipient, kilowatt }) {
        if (kilowatt > this.cdrMap[senderWallet.publicKey]) {
            throw new Error('Kilowatt exceeds killowatts');
        }

        if(!this.cdrMap[recipient]) {
            this.cdrMap[recipient] = kilowatt;
        } else {
            this.cdrMap[recipient] = this.cdrMap[recipient] + kilowatt;
        }

        this.cdrMap[senderWallet.publicKey] = 
            this.cdrMap[senderWallet.publicKey] - kilowatt;

        this.sender = this.createSender({ senderWallet, cdrMap: this.cdrMap });
    }

    static validTransaction(transaction) {

        const { sender: { address, kilowatt, signature }, cdrMap } = transaction;

        const outputTotal = Object.values(cdrMap)
            .reduce((total, outputKilowatt) => total + outputKilowatt);

        if (kilowatt != outputTotal) {
            console.error(`Invalid transaction from ${address}`)
            return false;
        }

        if (!isValidSignature({ publicKey: address, data: cdrMap, signature })) {
            console.error(`Invalid transaction from ${address}`);
            return false;
        }

        return true;
    }

}

module.exports = Transaction;