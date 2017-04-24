#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

cat << EOP | mongo admin
use boost;
db.createUser({
	user: 'boost',
	pwd: 'boost',
	roles: [{
		role: "userAdminAnyDatabase"
	}]
});
EOP
