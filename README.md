# Budget App

This is a portable static budgeting app that runs entirely in the browser.

## Run locally

1. Copy the full project folder to any computer.
2. Open `index.html` in a browser.

On first launch, create a local account with your first name, last name, email ID, mobile number, username, and password. Each account stores its profile, opening balance, and entries separately in that browser, and the session is cleared when you sign out. This static version does not provide server-side authentication or cloud synchronization; use a backend identity and database when credentials must work across devices.

To download a report for a particular period, select the `From` and `To` dates above the chart before choosing `Download Report`. Leave either date blank to make that side of the range open-ended.

## Publish a global URL
  
### Option 1: GitHub Pages

1. Create or use this GitHub repository:
   `https://github.com/AaratiPardeshi/Monthly-budget`
2. Push the entire project folder to that repository.
3. In GitHub repository settings, enable Pages from the `gh-pages` branch (or `main` if you prefer).
4. Your app URL will be:
   `https://aaratipardeshi.github.io/Monthly-budget/`

### Option 2: Netlify

1. Create a Netlify account.
2. Connect your GitHub repository or drag-and-drop this folder into Netlify.
3. Netlify will publish a live URL automatically.

### Option 3: Vercel

1. Create a Vercel account.
2. Import the GitHub repo.
3. Vercel will provide a public URL.

## Why this works

- The app uses relative paths, not fixed drive letters.
- It can be served from any web host.
- It will be available globally once published.

## Example placeholder URL

`https://<your-username>.github.io/monthly-budget/`

Replace `<your-username>` with your GitHub username after publishing.

## Need help?

If you want, I can also help you create a GitHub repo and prepare a deployment-ready project structure.
