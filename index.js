/*
 Omschrijving: Eindopdracht module Blockchain
 Opleiding   : HBO Software Development - Hogeschool NOVI Utrecht
 Student     : V. Ciriello
 Student nr  : 800008924
 Datum       : november 2019
 
 Bestandsnaam: index.js
 Omschrijving: De (nodejs) Express index.js hoofdbestand.
*/
const express = require('express');
const bodyParser = require('body-parser');
const appStatus = require('./app/status');
const Blockchain = require('./app/blockchain');
const TransactionPool = require('./app/transaction/transaction-pool');
const Wallet = require('./app/wallet');
const PublishSubscribeManager = require('./app/pubsubmanager');
const Miner = require('./app/miner');

const app = express();

// De blockchain componenten
const blockchain = new Blockchain();
const wallet = new Wallet();
const transactionPool = new TransactionPool();
const pubSubManager = new PublishSubscribeManager({ blockchain, transactionPool })
const miner = new Miner({ blockchain, wallet, transactionPool, pubSubManager});

// De webapplicatie Routers
const blockchainRouter = require('./app/blockchain/router')({
    blockchain
});
const transactionRouter = require('./app/transaction/router')({
    blockchain, wallet, transactionPool, miner, pubSubManager
});
const walletRouter = require('./app/wallet/router')({
    blockchain, wallet
});
const errorRouter = require('./app/error')();

// Poort configuratie voor de nodes
const ROOT_NODE_POORT = 3000; // rootnode portnummer
const ROOT_NODE_ADRES = `http://localhost:${ROOT_NODE_POORT}`; // rootnode url

// genereer een willekeurig poortnummer voor subnodes tussen 4000 - 5000
let SUB_NODE_POORT;
if (process.env.RANDOM_NODE_PORT) {
    const random = Math.random() * 1000;
    SUB_NODE_POORT = ROOT_NODE_POORT + 1000 + Math.ceil(random);
}
const NODE_POORT = SUB_NODE_POORT || ROOT_NODE_POORT


/**
 * De Blockchain Backend
 */

// voeg JSON parser middleware toe aan express
app.use(bodyParser.json());

// een statuscheck uri-endpoint: om het starten van de node te valideren.
app.use('/app/status', appStatus);

// Blockchain router
app.use('/api/blocks', blockchainRouter);

// Transaction router
app.use('/api/transaction', transactionRouter);

// Wallet router
app.use('/api/wallet', walletRouter);

// Error Handler als er een onbekende request aangevraagd wordt
app.use('*', errorRouter);

// start de NODE. Er is een ROOT of CLIENT node configureerbaar
app.listen(NODE_POORT, () => {
    let node_type;
    if (SUB_NODE_POORT) {
        node_type = "CLIENT NODE"
    } else {
        node_type = "ROOT NODE"
    }

    console.log(`${node_type} gestart en bereikbaar op url: http://localhost:${NODE_POORT}`);
    console.log(`${node_type} status via url: http://localhost:${NODE_POORT}/app/status`);

});
