const clear = require("clear");
const inquirer = require("inquirer");
const { objValueMap, log, createFile, createDir, getTmp, runPrettier, removeKeyLines, replaceKeys, cpFile, saveSettings } = require("../utils");

const choose = () => {
  const choices = [
    { name: "Babel", disabled: "Selected by default", value: "BABEL" },
    { name: "Mocha", value: "MOCHA" },
    { name: "Istanbul (code coverage)", value: "ISTANBUL" },
    { name: "Lint-staged & Prettier", value: "LINTSTAGED" },
    { name: "Travis CI", value: "TRAVIS" },
    { name: "Codecov CI", value: "CODECOV" },
  ];
  const questions = [
    {
      type: "checkbox",
      name: "VERSION",
      message: "Choose features?",
      choices
    }
  ];
  return inquirer.prompt(questions);
};

const askQuestions = ifCoverage => {
  const coverage = [
    {
      name: "COVERAGESTATEMENTS",
      type: "input",
      message: "Coverage test percent statements:",
      default: "90"
    },
    {
      name: "COVERAGEBRANCHES",
      type: "input",
      message: "Coverage test percent branches:",
      default: "90"
    },
    {
      name: "COVERAGEFUNCTIONS",
      type: "input",
      message: "Coverage test percent functions:",
      default: "90"
    },
    {
      name: "COVERAGELINES",
      type: "input",
      message: "Coverage test percent lines:",
      default: "90"
    }
  ];
  const questions = [
    {
      name: "PACKAGENAME",
      type: "input",
      message: "Library name:"
    },
    {
      name: "DESCRIPTION",
      type: "input",
      message: "Description:"
    },
    {
      name: "GITREPOSITORY",
      type: "input",
      message: "Git repository url (https://github.com/user/repo):"
    },
    {
      name: "LICENSE",
      type: "input",
      message: "License (MIT):",
      default: "MIT"
    },
    {
      name: "AUTHORNAME",
      type: "input",
      message: "Author name:",
    },
    {
      name: "AUTHOREMAIL",
      type: "input",
      message: "Author email:",
    },
    {
      name: "AUTHORURL",
      type: "input",
      message: "Author website (url):",
    },
    ...(ifCoverage ? coverage : []),
  ];
  return inquirer.prompt(questions);
};

const createLibBabel = async () => {
  const tempFiles = getTmp('create-lib-babel', 'files');
  const files = {
    packageJson: 'package.json',
    babelRc:'.babelrc',
    gitignore:'.gitignore',
    readme: 'README.md',
    travisYml: '.travis.yml'
  }
  const filesSrc = objValueMap(value => `${tempFiles}/${value}`)(files);

  clear();
  log.figlet();
  log.info('Opionated Javascript-library setup with Babel ES6');
  log.br();

  // ask questions
  const { VERSION } = await choose();

  const isIstanbul = VERSION.includes('ISTANBUL');
  if (!isIstanbul) VERSION.push('NOISTANBUL');
  const isTravis = VERSION.includes('TRAVIS');
  const versionsPackageJson = {mocha: 'MOCHA', istanbul: 'ISTANBUL', noistanbul: 'NOISTANBUL', lintstaged: 'LINTSTAGED', travis: 'TRAVIS', codecov: 'CODECOV'};
  const versionsBabelRc = {istanbul: 'ISTANBUL'};
  const versionsTravisYml = {mocha: 'MOCHA', istanbul: 'ISTANBUL', codecov: 'CODECOV'};
  removeKeyLines([filesSrc.packageJson], versionsPackageJson, VERSION);
  removeKeyLines([filesSrc.babelRc], versionsBabelRc, VERSION);
  if(isTravis) {
    removeKeyLines([filesSrc.travisYml], versionsTravisYml, VERSION);
  }

  // ask questions
  const answers = await askQuestions(isIstanbul);

  replaceKeys([filesSrc.packageJson, filesSrc.readme], answers);

  runPrettier({ dir: tempFiles });
  clear();
  Object.keys(files).forEach(key => {
    const checkTravis = (key !== 'travisYml' || isTravis);
    if (checkTravis) {
      cpFile(filesSrc[key], files[key]);
    }
  });

  saveSettings({
    createLibBabel: {
      version: VERSION,
      answers
    }
  });

  log.thankYou();
};

module.exports = {
  createLibBabel
};