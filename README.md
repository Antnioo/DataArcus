# build-data

This branch holds one file, `usage.json`: the usage (cost and tokens) of the DataArcus builders and
sessions, per job and per day. A script in the private engine repo writes it; nobody edits it by hand.
The build page reads it in the browser. It holds no session ids, no prompts and no private notes.
