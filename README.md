# seating-arrangement
## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Installation](#installation)
- [Usage](#usage)
  - [Running the Application](#running-the-application)
  - [Committing without Husky](#committing-without-husky)

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/AnanthuTD/seating-arrangement.git
Navigate to the project directory:

cd seating-arrangement
Install the dependencies:

npm install
Usage
Running the Application
1.Start the development server:

npm run dev
This will start your Node.js application using Nodemon, which monitors for changes and automatically restarts the server.

2.Open your browser and visit http://localhost:3000 to access your application.

3.Make changes to the code, and Nodemon will automatically reload the server whenever changes are detected.

4.To run linting and formatting:

npm run lint
npm run format

Committing without Husky
While Husky enforces code quality by running checks before committing, there might be cases where you need to commit without running these checks. You can use the --no-verify flag with the git commit command to bypass Husky's Git hooks:

git commit -m "Your commit message" --no-verify
However, it's recommended to follow the established development practices and let Husky ensure code quality standards.
