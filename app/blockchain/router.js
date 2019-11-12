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
    
    router.get('/', (req, res) => {
        res.json(blockchain.chain);
    });
    
    return router;
};