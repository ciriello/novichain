/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: router.js (Transaction Router)
 Omschrijving: Transaction Router handeld alle /transaction request af
*/

const express = require('express');
const router = express.Router()

module.exports = ({ blockchain, wallet, transactionPool, miner, pubSubManager }) => {
    
    // Router Logger en Timer
    router.use((req, res, next) => {
        console.log('transaction pool router Time:', Date.now());
        next();
    });
    
    // Toont een lijst met alle actieve transacties
    router.get('/', (req, res) => {
        res.json(transactionPool.transactionMap);
    });

    // Voegt een transactie toe aan de transactie pool
    router.post('/', (req, res) => {
        const { recipient, kilowatt } = req.body;
        const { chain } = blockchain;
        try {
            let transaction = transactionPool.addTransaction({ chain, wallet, recipient, kilowatt });
            pubSubManager.broadcastTransaction(transaction);
            return res.status(200).json({
                statusCode: 200,
                status: 'success',
                transaction
            });
        } catch(error) {
            return res.status(400).json({
                statusCode: 400,
                status: 'error',
                message: error.message
            });
        }
    });

    // Mine een nieuwe block met alle actieve transacties en leeg de transactie pool
    router.get('/mine', (req, res) => {
        miner.mine();
        res.redirect('/api/blocks');
    });

    return router;
};
