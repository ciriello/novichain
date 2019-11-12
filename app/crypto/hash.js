/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: hash.js
 Omschrijving: Deze module genereerd een hashwaarde van alle properties uit een block object.
             : De properties worden gesorteerd, om te voorkomen dat er eventueel een afwijkende
             : waarde gegenereerd wordt, bij de validatie van de hash.
*/
const crypto = require('crypto');

const hash = (...properties) => {
    const sha256hash = crypto.createHash('sha256');
    return sha256hash.update(
        properties.map(prop => JSON.stringify(prop)).sort().join()
    ).digest('hex');
};

module.exports = hash;