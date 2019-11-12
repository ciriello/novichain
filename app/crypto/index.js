/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: index.js - Crypto Module
 Omschrijving: signature validator voor noviblockchain app,
               exporteert hash en ellipticCurve functies
*/
const EC = require('elliptic').ec;
const hasher = require('./hash');

const ellipticCurve = new EC('secp256k1');

const isValidSignature = ({ publicKey, signature, data }) => {
    const keyFromPublic = ellipticCurve.keyFromPublic(publicKey, 'hex');
    return keyFromPublic.verify(hasher(data), signature);
};

module.exports = { hasher, ellipticCurve, isValidSignature };