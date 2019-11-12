/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: router.js (Wallet Router)
 Omschrijving: De wallet router classe. Deze classe handeld alle /wallet route request af
*/

const express = require('express');
const router = express.Router();
const Wallet = require('.');

module.exports = ({ wallet, blockchain }) => {
    
    router.use((req, res, next) => {
        console.log('Wallet router Time:', Date.now());
        next();
    });

    router.get('/', (req, res) => {
        const address = wallet.publicKey;
        res.json({
            statusCode: 200,
            status: 'success',
            address,
            kilowatts: Wallet.calculateKilowatts({ chain: blockchain.chain, address })
        })
    });

    return router;
}