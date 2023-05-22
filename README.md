# last.fm Account Scraper
Scrapes user data from last.fm using their API by recursively finding users through friends. The program will store all results inside `scraped_data.csv`

If you do not have a last.fm API key, you can get one here: https://www.last.fm/api/account/create

## How To Use
1. Open `main.js` and enter your last.fm API key into the `apiKey` variable. Below this line you can also edit the `rootUser` paramter inside the `startScraping()` function. This will change the user the program will start scraping from.
3. Run `main.js` via your IDE of choice or the terminal.
4. You can stop the program whenever you want. All results will be stored inside of `scraped_data.csv`

## Output Descriptions
| Output | Description |
| :---         |     :---      | 
| `username`   | Account username     |
| `country`     | Account country of origin       |
| `date_registered` | YYYY-MM-DD date of account creation |
| `scrobbles` | The accounts total number of scrobbles |
| `artists` | The total number of unique artists |
| `albums` | The total number of unique albums |
| `tracks` | The total number of unique tracks |
| `subscribed` | Whether the account has last.fm Pro or not |
