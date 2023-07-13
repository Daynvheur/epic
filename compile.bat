cd /d %~dp0
@REM npm install
@REM npm audit fix
@REM npx browserslist@latest --update-db
@REM npm install -g parcel-bundler
parcel serve src/index.html
