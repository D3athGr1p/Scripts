# consolidate-utxo
Tool which helps consolidate your unspent transactions outputs


When you have a long-running bitcoin(UTXO based coin) wallet with big transaction history, you might start getting errors like `Transaction too large` during the withdrawal. That's because you have a lot small UTXOs (Unspent transaction outputs) and when bitcoin node tries to build transaction it became too large. To fix this you need to Consolidate your UTXO set.

## How to install

This program is written in JavaScript and to run in you need NodeJS to be installed on your system.
```bash
git clone https://github.com/D3athGr1p/Scripts.git
cd MergeUTXO_using_privateKey
```

## How to use

> create `.env` file in this folder
```bash
PRIVATEKEY=""
FROM=""
OUTPUTADDRESS=""

PORT="" (RPC Port)
RPCUSER="root"
RPCPASSWORD="toor"
bip32PUB=""
bip32PRIV=""
pubKeyHash=""
scriptHash=""
WIF=""
```
bitcoin.conf example:
```
server=1
rpcuser=root
rpcpassword=toor
```