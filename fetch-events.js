name: Fetch Events Daily

on:
  schedule:
    - cron: "0 6 * * *"
  workflow_dispatch:

jobs:
  fetch-events:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          ref: main
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Fetch events from Eventbrite
        env:
          EVENTBRITE_TOKEN: ${{ secrets.EVENTBRITE_TOKEN }}
        run: node fetch-events.js

- name: Push updated events.json
        run: |
          git config user.name "Round Here NW Bot"
          git config user.email "bot@roundherenw.co.uk"
          git add events.json
          git diff --staged --quiet && echo "No changes" && exit 0
          git commit -m "chore: update events $(date -u +%Y-%m-%d)"
          git push --force origin main
