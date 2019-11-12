/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: index.js (Error Handler)
 Omschrijving: De express middleware router handeld de onbekende router requests af
*/

const express = require('express');
const router = express.Router()

module.exports = () => {

    const errorJson = {
        statusCode: 404,
        message: 'error',
        description: 'The requested document is not found.'
    };

    router.use('*', (req, res) => {
        return res.json(errorJson);
    });

    return router;

}