# ksu-ag-extension-map.github.io

### University Extension History Map

A lightweight public web map for displaying extension
service locations and historical events.

## Updating Data

1. Open the Excel spreadsheet.
2. Add or edit records.
3. Save as CSV.
4. Replace:

data/events.csv

5. Commit changes to GitHub.

The map updates automatically.

## Fields

| Field | Description |
|---------|-------------|
| name | Event title |
| latitude | Latitude |
| longitude | Longitude |
| start_year | Beginning year |
| end_year | Ending year |
| category | Program category |
| description | Popup description |

## Deployment

Settings → Pages → Deploy from Main Branch

Site URL:

https://YOUR_USERNAME.github.io/extension-history-map/
