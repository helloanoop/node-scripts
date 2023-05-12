const axios = require('axios');
const config = require('config');
const Table = require('cli-table3');

const owner = 'oven-sh'; // Replace with the owner of the repository
const repo = 'bun'; // Replace with the name of the repository
const token = config.github.token; // Replace with your GitHub personal access token

console.log(`Fetching stats for ${owner}/${repo}...`);

// Get the last three months dynamically
// ex: [
//   { year: 2023, month: 4 },
//   { year: 2023, month: 3 },
//   { year: 2023, month: 2 }
// ]
function getLastThreeMonths() {
  const currentDate = new Date();
  const currentYear = currentDate.getUTCFullYear();
  const currentMonth = currentDate.getUTCMonth();

  const months = [];
  for (let i = 0; i < 3; i++) {
    const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
    const month = currentMonth - i < 0 ? 12 + (currentMonth - i) : currentMonth - i;
    months.push({ year, month });
  }

  return months;
}

// Fetch commits for a given month
async function fetchCommits(year, month) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits`;
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Node.js',
    },
    params: {
      since: `${year}-${month + 1}-01T00:00:00Z`,
      until: `${year}-${month + 1}-31T23:59:59Z`,
    },
  };

  try {
    console.log(`Fetching commits for ${year}-${month}`);
    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    console.error(`Error fetching commits for ${year}-${month}:`, error.message);
    return [];
  }
}

// Fetch commits for the last three months
async function fetchCommitsForLastThreeMonths() {
  const months = getLastThreeMonths();

  const commitsByUser = {};
  for (const { year, month } of months) {
    const commits = await fetchCommits(year, month);
    for (const commit of commits) {
      const username = commit.commit.author.name;
      commitsByUser[username] = commitsByUser[username] || {};
      commitsByUser[username][`${year}-${month + 1}`] = (commitsByUser[username][`${year}-${month + 1}`] || 0) + 1;
    }
  }

  return commitsByUser;
}

// Display the commits in a table
function displayCommitsTable(commitsByUser) {
  const months = getLastThreeMonths().map(({ year, month }) => `${year}-${month + 1}`);

  // Create the table
  const table = new Table({
    head: ['User', ...months],
  });

  // Add the data rows
  Object.entries(commitsByUser).forEach(([username, commits]) => {
    const row = [username, ...months.map(month => commits[month] || 0)];
    table.push(row);
  });

  // Display the table
  console.log(table.toString());
}

// Usage
fetchCommitsForLastThreeMonths()
  .then((commitsByUser) => {
    displayCommitsTable(commitsByUser);
  })
  .catch((error) => {
    console.error('Error:', error.message);
  });
