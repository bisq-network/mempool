## Quick Setup for Development

  (prerequisite: bisq-daonode is installed & running)

### Install node, npm, n

```
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
    source ~/.bashrc
    nvm install v16.14
    node -v
    npm -v
    npm install -g n
    n --version
```

### Explorer Backend


```
    cd mempool/backend
    npm install
    npm run build
    npm run start
```
 
    logging should show it connecting to Bisq, retrieving blocks, prices, offers, trades etc.

### Explorer Frontend
    
```
    cd mempool/frontend
    npm install
    npm run build
    npm run serve
```
 
    the explorer should be visible in a browser at http://localhost:4200    
    alternately, to have the frontend served by nginx:
        `cp mempool/frontend/dist/mempool/browser/en-US/* /var/www/mempool`



