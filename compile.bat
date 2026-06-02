cd /d %~dp0
@REM npm install
@REM npm audit fix
@REM npm approve-scripts -a
@REM npm install -g parcel-bundler
@REM npx update-browserslist-db@latest
REM example url: http://localhost:1234/?range=1252&complexity=42&circles=1&pt=100;500&pt=100;100&pt=500;100&pt=100;500&pt=500;500&pt=100;100&pt=300;0&pt=500;100&pt=500;500
parcel serve src/index.html
