name: Fetch Events Daily

on:
  schedule:
    - cron: "0 6 * * *"
  workflow_dispatch:

jobs:
  fetch-events:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Fetch events
        env:
          EVENTBRITE_TOKEN: ${{ secrets.EVENTBRITE_TOKEN }}
        run: node fetch-events.js

      - name: Save events.json
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update events"
          file_pattern: events.json
