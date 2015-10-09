# chessboard-io
Chessboard Multiplayer

## Debug

	npm-debug ./bin/www

## Update to github

	git push origin master

## Deploy

	cd ~/www/chessboard-io
	git pull
	npm install && npm update
    bower install && bower update

	pm2 restart www

## Nginx Config

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

## TODO

- Add timer for game
- Add resign button
- highlight the move when user hovers on the game log entry
- show indication when opponent piece is killed in game log
- show the piece icon in game log
- add timestamp in game log
