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

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Fetch events from Eventbrite
        env:
          EVENTBRITE_TOKEN: ${{ secrets.EVENTBRITE_TOKEN }}
        run: node fetch-events.js

      - name: Upload events.json via GitHub API
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          CONTENT=$(base64 -w 0 events.json)
          SHA=$(gh api repos/${{ github.repository }}/contents/events.json --jq '.sha' 2>/dev/null || echo "")
          if [ -z "$SHA" ]; then
            gh api repos/${{ github.repository }}/contents/events.json \
              -X PUT \
              -f message="chore: update events $(date -u +%Y-%m-%d)" \
              -f content="$CONTENT"
          else
            gh api repos/${{ github.repository }}/contents/events.json \
              -X PUT \
              -f message="chore: update events $(date -u +%Y-%m-%d)" \
              -f content="$CONTENT" \
              -f sha="$SHA"
          fi
