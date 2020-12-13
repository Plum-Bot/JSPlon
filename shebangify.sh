#!/bin/bash

rm plon.js
touch plon.js
echo "#!/usr/bin/env node
`cat "built/plon.js"`" > "plon.js"
mv plon.js built