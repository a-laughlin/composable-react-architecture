# UI Hyper-Composability Demo

## Goal
Prototype a hyper-composable, hyper-decoupled UI architecture.  The result thus far is the most productive and fun architecture I've ever worked with.  For background, see the companion [blog post](http://www.a-laughlin.com/hyper-composable-react-architecture).

Screencast tbd.  Let me know if you think it would be useful.

## Basic concept:
Improve composability by eliminating unnecessary dependency graphs, and flattening necessary ones.

UIs are usually composed of lists of vertically and horizontally styled elements.

1. Start with string elements. `'div'`.
2. Wrap them in compose. `const Div = (...HOCs)=>compose(...HOCs)('div');`
3. Add React Higher Order Components for attributes, styles, behaviors, data, and everything else
  - children via `withItems`
  - styles via `withStyles` and `withItemContextStyles`
  - events via `pipeClicks`, `pipeChanges`, etc.
  - withReduxData for redux data
  - withGQLData for GraphQL data
4. Sprinkle some lodash/fp
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
