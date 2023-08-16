const https = require("node:https");
const jsdom = require("jsdom");
const inquirer = require("inquirer");

const readline = require("node:readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function displayMovieDetails(url) {
  return new Promise((resolve, reject) => {
    https.get(`https://www.imdb.com${url}`, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        const dom = new jsdom.JSDOM(data);

        // Title
        const h1 = dom.window.document.querySelector(
          '[data-testid="hero__pageTitle"]'
        );
        const span = h1.querySelector("span");
        const title = span.textContent;

        // Release Date
        const ul = h1.nextElementSibling;
        const releaseDate = ul.firstElementChild.firstElementChild.textContent;

        // Age Rating
        const ageRating = ul.children[1].firstElementChild.textContent;

        // Runtime
        const runtime = ul.children[2].textContent;

        // Rating
        const rating = dom.window.document
          .querySelector(
            '[data-testid="hero-rating-bar__aggregate-rating__score"]'
          )
          .querySelector("span").textContent;

        console.log("Title:", title);
        console.log("Release date:", releaseDate);
        console.log("Age Rating:", ageRating);
        console.log("Runtime:", runtime);
        console.log("Rating:", rating + "/10");

        resolve(data);
      });

      res.on("error", (error) => {
        reject(error);
      });
    });
  });
}

rl.question("What movie do you want to search for? ", (answer) => {
  console.log(`Searching for ${answer}...`);
  https
    .get(`https://www.imdb.com/find/?q=${answer}`, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", async () => {
        const dom = new jsdom.JSDOM(data);
        const section = dom.window.document.querySelector(
          '[data-testid="find-results-section-title"]'
        );
        const firstResult = section.children[1];
        const ul = firstResult.querySelector("ul");
        const results = [...ul.children].map((li) => {
          const div = li.children[1];
          const div2 = div.children[0];
          const a = div2.children[0];

          const href = a.href;
          const text = a.textContent;
          return { text, href };
        });

        const movieList = results.map(({ text }) => text);
        inquirer
          .prompt([
            {
              type: "list",
              name: "selectedMovie",
              message: "Select a movie:",
              choices: movieList,
            },
          ])
          .then((answers) => {
            const selectedMovie = answers.selectedMovie;
            const selectedMovieData = results.find(
              (movie) => movie.text === selectedMovie
            );
            console.log("You selected:", selectedMovieData.text);
            console.log(
              "Movie URL:",
              "https://www.imdb.com" + selectedMovieData.href
            );
            displayMovieDetails(selectedMovieData.href);
          })
          .catch((error) => {
            console.error("Error:", error);
          })
          .finally(() => {
            rl.close();
          });
      });
    })
    .on("error", (error) => {
      console.error("Error:", error);
      rl.close();
    });
  // rl.close();
});
