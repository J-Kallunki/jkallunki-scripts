const clear = require("clear");
const inquirer = require("inquirer");
const { objValueMap, log, createFile, createDir, getTmp, runPrettier, removeKeyLines, replaceKeys, cpFile, saveSettings } = require("../utils");

const choose = () => {
  const choices = [
    { name: "Webpack 4", disabled: "Selected by default", value: "WEBPACK" },
    { name: "Typescript", disabled: "Selected by default", value: "TYPESCRIPT" },
    { name: "React", disabled: "Selected by default", value: "REACT" },
    { name: "ES2015 and ESM (ES Modules) builds", value: "ESM" },
    { name: "Emotion 10", value: "EMOTION" },
    { name: "TSlint", value: "TSLINT" },
    { name: "React-testing-library & Jest", value: "JEST" },
    { name: "Lint-staged & Prettier", value: "LINTSTAGED" },
    { name: "Styleguidist", value: "STYLEGUIDIST" },
    { name: "Travis CI", value: "TRAVIS" },
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

const createLibTsReact = async () => {
  const tempFiles = getTmp('create-lib-ts-react', 'files');
  const files = {
    packageJson: 'packagejson',
    gitignore:'gitignore',
    readme: 'README.md',
    travisYml: 'travisyml',
    prettierRc: 'prettierrc',
    webpackConfig: 'webpackconfigjs',
    tslintJson: 'tslintjson',
    tsconfigJson: 'tsconfigjson',
    tsconfigEsmJson: 'tsconfigesmjson',
    tsconfigEs2015Json: 'tsconfiges2015json',
    styleguideConfigJs: 'styleguideconfigjs',
    jestConfigJs: 'jestconfigjs',
    jestSetupJs: 'jestsetupjs',
    npmRc: 'npmrc'
  }
  const realFilenames = {
    packageJson: 'package.json',
    gitignore: '.gitignore',
    travisYml: '.travis.yml',
    prettierRc: '.prettierrc',
    webpackConfig: 'webpack.config.js',
    tslintJson: 'tslint.json',
    tsconfigJson: 'tsconfig.json',
    tsconfigEsmJson: 'tsconfig.esm.json',
    tsconfigEs2015Json: 'tsconfig.es2015.json',
    styleguideConfigJs: 'styleguide.config.js',
    jestConfigJs: 'jest.config.js',
    jestSetupJs: 'jest.setup.js',
    npmRc: '.npmrc'
  }
  const filesSrc = objValueMap(value => `${tempFiles}/${value}`)(files);

  clear();
  log.figlet();
  log.info('Opinionated React setup with Webpack 4 and Typescript');
  log.br();

  // ask questions
  let { VERSION } = await choose();
  const isFeat = feat => VERSION.includes(feat);

  const isStyleguidist = isFeat('STYLEGUIDIST');
  if (!isStyleguidist) VERSION = [...VERSION, 'NOSTYLEGUIDIST'];
  const isJest = isFeat('JEST');
  if (!isJest) VERSION = [...VERSION, 'NOJEST'];
  const isTslint = isFeat('TSLINT');
  if (!isTslint) VERSION = [...VERSION, 'NOTSLINT'];
  const isLintstaged = isFeat('LINTSTAGED');
  if (!isLintstaged) VERSION = [...VERSION, 'NOLINTSTAGED'];
  const isTravis = isFeat('TRAVIS');
  const isEsm = isFeat('ESM');
  if (!isEsm) VERSION = [...VERSION, 'NOESM'];
  const versionsPackageJson = {
    styleguidist: 'STYLEGUIDIST',
    jest: 'JEST',
    tslint: 'TSLINT',
    lintstaged: 'LINTSTAGED',
    emotion: 'EMOTION',
    travis: 'TRAVIS',
    esm: 'ESM',
    nostyleguidist: 'NOSTYLEGUIDIST',
    nojest: 'NOJEST',
    notslint: 'NOTSLINT',
    nolintstaged: 'NOLINTSTAGED',
    noesm: 'NOESM',
  };
  removeKeyLines([filesSrc.packageJson], versionsPackageJson, VERSION);
  const versionsWebpackConfig = {
    tslint: 'TSLINT',
  };
  removeKeyLines([filesSrc.webpackConfig], versionsWebpackConfig, VERSION);

  // ask questions
  const answers = await askQuestions(isJest);

  replaceKeys([filesSrc.packageJson, filesSrc.readme, filesSrc.jestConfigJs], answers);

  runPrettier({ dir: tempFiles });
  clear();
  createDir('src');
  cpFile(`${tempFiles}/indextsx`, 'src/index.tsx');
  if (isJest) {
    cpFile(`${tempFiles}/indextesttsx`, 'src/index.test.tsx');
  }
  Object.keys(files).forEach(key => {
    const check = {
      travisYml: isTravis,
      prettierRc: isLintstaged,
      tslintJson: isTslint,
      styleguideConfigJs: isStyleguidist,
      jestConfigJs: isJest,
      jestSetupJs: isJest,
      tsconfigEsmJson: isEsm,
      tsconfigEs2015Json: isEsm
    }
    if (check[key] === undefined || check[key]) {
      const dest = realFilenames.hasOwnProperty(key) ? realFilenames[key] : files[key];
      cpFile(filesSrc[key], dest);
    }
  });

  saveSettings({
    createLibTsReact: {
      version: VERSION,
      answers
    }
  });

  clear();
  log.thankYou();
  log.info(`Run command: ${log.color('green')('yarn')}`);
  log.info(`Check created package.json: ${log.color('yellow')('scripts')}!`);
  log.info(`Create your code to ${log.color('yellow')('src/')}`);

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
  log.credits();
};

module.exports = {
  createLibTsReact
};