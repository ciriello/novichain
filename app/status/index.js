/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: index.js (Status)
 Omschrijving: Applicatie Status Router. Geeft aan of de applicatie is opgestart en draait.
*/

const express = require('express');
const router = express.Router()

router.get('/', (req, res) => {
    res.json({
        status: 200,
        message: "SERVER IS UP AND RUNNDING"
    });
});

module.exports = router;