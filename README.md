# Composable React Architecture

Improve composability by reducing dependency graphs.

1. Start with string elements `'div'`. (for small test surface. Also works with non-string components).  
2. Wrap them in compose. `const Div = (...HOCs)=>compose(...HOCs)('div');`  
3. Compose with React HOCs (Higher order Components) for everything else  
  - Children via `withItems`
  - Styles via `withStyles` and `withItemContextStyles`
  - Events via `pipeClicks`, `pipeChanges`, etc.
  - Redux data via `withReduxData`
  - GraphQL data via `withGQLData`
4. Sprinkle some lodash/fp and recompose   
5. That's it!  

More details on HOCs and usage in `components.js` comments.

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
