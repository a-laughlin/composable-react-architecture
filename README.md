# Composable React Architecture

Improve composability by reducing dependency graphs.  
  
Note: This repo is from 2016/17.  While the basic concepts and syntax apply, changes in React (e.g., hooks) and other libraries enable simpler and cleaner implementations.  I also rewrote style composition to be more consise, performant, and unit tested in later projects.

1. React HOCs (Higher order Components) for everything
  - Children via `withItems`
  - Styles via `withStyles` and `withItemContextStyles`
  - Events via `pipeClicks`, `pipeChanges`, etc.
  - Redux data via `withReduxData`
  - GraphQL data via `withGQLData`
2. Sprinkle lodash/fp and recompose   
3. That's it!  

More details on HOCs and usage in [`src/components.js`](https://github.com/a-laughlin/composable-react-architecture/blob/master/src/components.js) comments.

## Installing & Running.
**Install** `npm i`;
**Run** `npm start`;

## Dependencies
Includes GraphQL, React, Redux, and a few others.  See `package.json`.

Built on [create-react-app](https://github.com/facebookincubator/create-react-app).




## File Structure
- public/index.js - initializes the redux store and renders `App`
- src/reset.css - reset styles...
- src/components.js - All demo components.  Exports most. Includes app.
- src/hoc-utils.js - all the HOC util functions for the demo
- src/styles.js - integrates styletron, provides styles shorthands and HOCs
- src/api.js - graphql schema and some basic api interaction functions
