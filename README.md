# Novichain
Blockchain applicatie t.b.v. Eindopdracht HBO Software Development - Hogeschool NOVI

Een op eigen blockchain gebaseerde applicatie met data persistence in Redis. De blockchain app heeft een root node en meerdere subnodes. Als nodes uitvallen en/of weer opstarten wordt initieel alle data vanuit Redis ingeladen om de node weer tot de laatste status te synchroniseren

```
Blockchain applicatie met REDIS persistence
Publish & Subscribe mechanisme voor PEER to PEER communicatie
```
## Randvoorwaarde
Om deze applicatie lokaal te kunnen draaien is een lokale REDIS server noodzakelijk. Installeer een REDIS server en start deze voordat de Blockchain applicatie opgestart wordt.

### Let op
De synchronisatie van de sub-nodes gebeurt alleen via localhost. Synchronisatie over het internet of netwerk is daardoor niet mogelijk. Dit is bewust zo ingesteld.

## Installatie
> npm install

## Starten als ROOT node
> npm run dev-root

## Starten als SUB node
> npm run dev-peer

