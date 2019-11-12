/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: index.js (PublishSubscribeManager)
 Omschrijving: injecteert de gewenste implementatie van de PublishSubscribeManager
*/

// const PublishSubscribeManager = require('./pubnub-impl'); // PUBNUB implementatie
const PublishSubscribeManager = require('./pubredis-impl'); // REDIS implementatie

module.exports = PublishSubscribeManager;