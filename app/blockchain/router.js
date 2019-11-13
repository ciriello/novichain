/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: Router.js (Blockchain Router)
 Omschrijving: De Blockchain router. Deze router handeld alle /blocks requests af
*/

const express = require('express');
const router = express.Router()

module.exports = ({ blockchain }) => {
    
    router.use((req, res, next) => {
        console.log('blockchain router Time:', Date.now());
        next();
    });
    
    // Alle blocks uit de chain (via REDIS !!)
    router.get('/', async (req, res) => {
        const result = await blockchain.fullChain();
        res.json(result);
    });

    // Alle blocks uit de chain waar de sender adres in voorkomt. (via REDIS !!)
    router.get('/sender/:id', async (req, res) => {
        const { id } = req.params;
        const result = await blockchain.senderChain({ address: id });
        res.json(result);
    });

    // Laatste block uit de chain
    router.get('/last', async (req, res) => {
        res.json(await blockchain.lastBlock());
    });

    // Sync SUB nodes vanaf laatste bekende hash
    router.get('/sync/:hash', async (req, res) => {
        res.json(await blockchain.fullChain({}))
    });
    
    return router;
};