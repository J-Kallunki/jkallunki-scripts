#!/usr/bin/env node

const clear = require("clear");
const inquirer = require("inquirer");
const { log } = require("./utils");
const { createLibBabel } = require("./create-lib-babel/create-lib-babel");

const choose = () => {
  const choices = [
    { name: "Create Javascript-library with Babel ES6", value: "CREATELIBBABEL" },
    { name: "Create Javascript-library with Wepback ES6", disabled: "Not ready yet", value: "CREATELIBWEBPACK" },
    { name: "Upcming?", disabled: "Dunno what else", value: "UPCOMING" }
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

run();