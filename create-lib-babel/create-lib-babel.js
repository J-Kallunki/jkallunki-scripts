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
      message: "Coverage test percent - statements:",
      default: "90"
    },
    {
      name: "COVERAGEBRANCHES",
      type: "input",
      message: "Coverage test percent - branches:",
      default: "90"
    },
    {
      name: "COVERAGEFUNCTIONS",
      type: "input",
      message: "Coverage test percent - functions:",
      default: "90"
    },
    {
      name: "COVERAGELINES",
      type: "input",
      message: "Coverage test percent - lines:",
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
    packageJson: 'packagejson',
    babelRc: 'babelrc',
    gitignore:'gitignore',
    readme: 'README.md',
    travisYml: 'travisyml',
    prettierRc: 'prettierrc'
  }
  const realFilenames = {
    packageJson: 'package.json',
    babelRc: '.babelrc',
    gitignore: '.gitignore',
    travisYml: '.travis.yml',
    prettierRc: '.prettierrc'
  }
  const filesSrc = objValueMap(value => `${tempFiles}/${value}`)(files);

  clear();
  log.figlet();
  log.info('Opinionated Javascript-library setup with Babel ES6');
  log.br();

  // ask questions
  let { VERSION } = await choose();
  const isFeat = feat => VERSION.includes(feat);

  const isIstanbul = isFeat('ISTANBUL');
  if (!isIstanbul) VERSION = [...VERSION, 'NOISTANBUL'];
  const isTravis = isFeat('TRAVIS');
  const isLintstaged = isFeat('LINTSTAGED');
  const versionsPackageJson = {mocha: 'MOCHA', istanbul: 'ISTANBUL', noistanbul: 'NOISTANBUL', lintstaged: 'LINTSTAGED', travis: 'TRAVIS', codecov: 'CODECOV'};
  const versionsBabelRc = {istanbul: 'ISTANBUL'};
  const versionsTravisYml = {mocha: 'MOCHA', istanbul: 'ISTANBUL', codecov: 'CODECOV', lintstaged: 'LINTSTAGED'};
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
  createDir('src');
  createFile('src/index', 'js');
  Object.keys(files).forEach(key => {
    const checkTravis = (key !== 'travisYml' || isTravis);
    const checkPrettier = (key !== 'prettierRc' || isLintstaged);
    if (checkTravis && checkPrettier) {
      const dest = realFilenames.hasOwnProperty(key) ? realFilenames[key] : files[key];
      cpFile(filesSrc[key], dest);
    }
  });

  saveSettings({
    createLibBabel: {
      version: VERSION,
      answers
    }
  });

  clear();
  log.thankYou();
  log.info(`Run command: ${log.color('green')('yarn')}`);
  log.info(`Check created package.json: ${log.color('yellow')('scripts')}!`);
  log.info(`Create your library to ${log.color('yellow')('src/')}`);

  if (isLintstaged) {
  log.br();
  log.info(`I suggest adding VSCode Prettier-plugin:
${log.color('green')('CMD+Shift+P')} ${log.color('yellow')('ext install esbenp.prettier-vscode')}
${log.color('green')('CMD+Shift+P')} ${log.color('yellow')('openWorkspaceSettings')}
${log.color('yellow')('"editor.formatOnSave": true,')}
${log.color('yellow')('"prettier.singleQuote": true')}`);
  }

  if (isTravis) {
    log.br();
    log.info(`${log.color('cyan')('https://travis-ci.com/')} "${log.color('green')('Sign in with Github')}"`);
    log.info(`${log.color('cyan')('https://travis-ci.com/profile')} "${log.color('green')('Add repo')}"`);
  }
  if (isFeat('CODECOV')) {
    log.br();
    log.info(`${log.color('cyan')('https://codecov.io/')} "${log.color('green')('Sign Up')}"`);
    log.info(`"${log.color('green')('Sign up with GitHub')}"`);
    log.info(`"${log.color('green')('Add new repository')}"`);
  }
  log.credits();
};

module.exports = {
  createLibBabel
};