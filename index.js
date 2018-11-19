#!/usr/bin/env node

const clear = require("clear");
const inquirer = require("inquirer");
const { log } = require("./utils");
const { createLibBabel } = require("./create-lib-babel/create-lib-babel");

const choose = () => {
  const choices = [
    { name: "Opinionated JavaScript library setup with Babel ES6", value: "CREATELIBBABEL" },
    { name: "Create JavaScript library with Webpack ES6", disabled: "Not ready yet", value: "CREATELIBWEBPACK" },
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
  } else {
    log.info('Bye bye!');
  }
}

// TODO: update .jkallunki-scripts instead of erasing
run();
