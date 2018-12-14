#!/usr/bin/env node

const clear = require("clear");
const inquirer = require("inquirer");
const { log } = require("./utils");
const { createLibBabel } = require("./create-lib-babel/create-lib-babel");
const { createLibTsReact } = require("./create-lib-ts-react/create-lib-ts-react");

const choose = () => {
  const choices = [
    { name: "Opinionated React setup with Webpack 4 and Typescript", value: "CREATELIBTSREACT" },
    { name: "Opinionated JavaScript library setup with Babel ES6", value: "CREATELIBBABEL" },
    { name: "Upcoming?", disabled: "Dunno what else", value: "UPCOMING" }
  ];
  const questions = [
    {
      type: "list",
      name: "SCRIPTS",
      message: "Choose script:",
      choices
    }
  ];
  return inquirer.prompt(questions);
};

const run = async () => {
  clear();
  log.figlet();


  const { SCRIPTS } = await choose();
  console.log(SCRIPTS);

  if(SCRIPTS === 'CREATELIBBABEL') {
    createLibBabel();
  } else if(SCRIPTS === 'CREATELIBTSREACT') {
    createLibTsReact();
  } else {
    log.info('Bye bye!');
  }
}

// TODO: update .jkallunki-scripts instead of erasing
run();
