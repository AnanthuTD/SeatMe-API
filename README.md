# seating-arrangement
## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Running the Application](#running-the-application)
  - [Committing without Husky](#committing-without-husky)
  - [Environment Variables](#environment-variables)
## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/AnanthuTD/seating-arrangement.git
2. Navigate to the project directory:

  ```sh
  cd seating-arrangement
```
3. Install the dependencies:

```sh
  npm install
```
## Usage
### Running the Application
1. Start the development server:

```sh
  npm run dev
```
This will start your Node.js application using Nodemon, which monitors for changes and automatically restarts the server.

2. Open your browser and visit http://localhost:3000 to access your application.

3. Make changes to the code, and Nodemon will automatically reload the server whenever changes are detected.

4. To run linting and formatting:

```sh
  npm run lint
```
```sh
  npm run format
```

### Committing without Husky
While Husky enforces code quality by running checks before committing, there might be cases where you need to commit without running these checks. You can use the `--no-verify` flag with the git commit command to bypass Husky's Git hooks:

```sh
git commit -m "Your commit message" --no-verify
```
However, it's recommended to follow the established development practices and let Husky ensure code quality standards.

### Environment Variables
To properly configure your application, you need to set up environment variables. The .env.example file in the repository provides a template for these variables. Here's what you should do:

1. Create a .env file:

Copy the contents of .env.example into a new file named .env.

2. Fill in the values:

Replace placeholders with actual values for your application's configuration. This includes variables like database credentials, API keys, etc.

3. Use .env in your app:

Your application will read configuration from the .env file. Make sure to use these variables in your code wherever needed.
