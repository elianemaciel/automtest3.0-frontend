
# AutomTest 3.0
Towards a Test Case Generation Tool Based on Functional Requirements.   
Article for it's first version:
https://dl.acm.org/doi/10.1145/3439961.3440002

## TO Start
First, you need Nodejs installed version 18 or above.
Then, run `npm i` in the root of this project

## Run
This application is solemly the frontend of the project. To run AutomTest 3.0, you must run the back-end in addition to this front-end.
The application back-end can be found here: <https://github.com/JoandersonG/AutomTest>
Once the back-end is set up, it's possible to run `npm start` to run the front-end as well.

## Deploy

Build Windows installer locally:

```bash
npm run package:win
```

Build Ubuntu/Linux packages locally:

```bash
npm run package:linux
```

The generated files are created in `release/build`.

GitHub Releases are generated automatically when a version tag is pushed:

```bash
git tag frontend-v0.1.0
git push origin frontend-v0.1.0
```

The release workflow builds:

- Windows: `.exe`
- Ubuntu/Linux: `.AppImage` and `.deb`
