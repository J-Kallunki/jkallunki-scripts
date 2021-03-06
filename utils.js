const path = require('path');
const fs = require('fs');
const lodashPick = require('lodash.pick');
const shell = require("shelljs");
const chalk = require("chalk");
const figlet = require("figlet");
const prettier = require("prettier");

const objValueMap = func => obj => Object.entries(obj).reduce((acc, [key, value]) => ({...acc, [key]: func(value) }), {});

const log = {
  figlet: text => {
    const message = !!text ? text : `JKallunki
    -scripts`;
    console.log(
      chalk.cyan.bgBlack(
        figlet.textSync(message, {
          font: "NScript",
          horizontalLayout: "universal smushing",
          verticalLayout: "universal smushing"
        })
      )
    );
  },
  thankYou: text => {
    const message = !!text ? text : 'Thank you';
    console.log(
      chalk.cyan.bgBlack(
        figlet.textSync(message, {
          font: "Lean",
          horizontalLayout: "universal smushing",
          verticalLayout: "universal smushing"
        })
      )
    );
  },
  br: () => console.log(''),
  color: color => text => chalk[color](text),
  info: text => {
    console.log(
      chalk.white.bgBlack.bold(text)
    );
  },
  success: text => {
    console.log(
      chalk.green.inverse(text)
    );
  },
  warn: text => {
    console.log(
      chalk.yellow.inverse(text)
    );
  },
  error: text => {
    console.log(
      chalk.red.inverse(text)
    );
  },
  credits: () => {
    console.log('');
    console.log('');
    console.log(chalk.white.bgBlack.bold('License: MIT'));
    console.log(chalk.black.bgCyan('https://github.com/J-Kallunki/jkallunki-scripts'));
  }
};

const createFile = (filename, extension) => {
  const filePath = `${process.cwd()}/${filename}.${extension}`
  shell.touch(filePath);
  return filePath;
};

const createDir = (dirName) => {
  const dirPath = `${process.cwd()}/${dirName}`
  shell.mkdir('-p', dirPath);
  return dirPath;
};

const cpFile = (src, localDest) => {
  if (!localDest) {
    log.error('Copying files did not work :(');
    return;
  }
  shell.cp(src, `${process.cwd()}/${localDest}`);
}

const rmFile = (file, { relativeFile = false } = {}) => {
  const what = relativeFile ? `${process.cwd()}/${file}` : file;
  shell.rm('-rf', what);
}

const getTmp = (scriptDir, dir) => {
  const sysTmp = shell.tempdir();
  const tmp = (!sysTmp || sysTmp.length < 2) ? '.temp-jkallunki' : `${sysTmp}/${scriptDir}/${dir}`;
  const localDir = path.resolve(__dirname, `${scriptDir}/${dir}`);
  shell.rm('-rf', `${tmp}/*`);
  shell.mkdir('-p', tmp);
  shell.cp('-Rf', `${localDir}/*`, tmp);
  shell.exec(
    `rsync -rtv ${localDir}/ ${tmp}`
  );
  return tmp;
}

const removeEmptyLines = file => {
  const blankLines = new RegExp(/(^[ \t]*\n)/, "gm");
  const removeBlankLines = (input) => input.replace(blankLines, "");
  const source = removeBlankLines(shell.cat(file));
  shell.echo(source).to(file);
}

const runPrettier = ({ dir = false, file = false, relativeFile = false } = {}) => {
  const localDir = path.resolve(__dirname);
  const cmdPrettier = to => shell.exec(`${localDir}/node_modules/.bin/prettier --single-quote --write ${to}`);
  if (!!dir) {
    const commands = [
      `"${dir}/*.{js,ts,css,less,scss,vue,json,gql,md}"`,
      `--loglevel silent --parser json "${dir}/babelrc"`,
      `--loglevel silent --parser json "${dir}/packagejson"`,
      `--loglevel silent --parser yaml "${dir}/travisyml"`
    ];
    commands.forEach(c => cmdPrettier(c));
    shell.ls(dir).forEach(function (file) {
      log.br();
      removeEmptyLines(`${dir}/${file}`);
    })
  }
  if (!!file) {
    const toFile = relativeFile ? `${process.cwd()}/${file}` : file;
    cmdPrettier(`"${toFile}"`);
  }
}

const readSrcFile = filename => {
  const content = fs.readFileSync(path.resolve(__dirname, filename), 'utf8', (err, data) => {
    if (err) throw err;
    log.error(`Error in: ${filename}`, data);
  });
  return content;
}

const replaceKeysForFiles = (file, { replaceValues = {}, removeValues = {}, replaceKeys = undefined, keepLines = undefined} = {}) => {
  const removeValuesArr = !!replaceKeys ? Object.entries(lodashPick(removeValues, replaceKeys)) : Object.entries(removeValues);
  const removingValues = removeValuesArr.length > 0;
  const entries = removingValues ? removeValuesArr : Object.entries(replaceValues);
  if (!entries || entries.length < 1) {
    log.error('Could not fix configs :(');
    return;
  }

  const removingLines = !!keepLines && typeof keepLines === 'object';
  const removeLinesKeys = value => !Object.values(keepLines).includes(value);
  entries.forEach(([key, value]) => {
    const searchValue = removingValues ? value : key;
    const search = removingLines && removeLinesKeys(value) ? new RegExp(`^.*__${searchValue}__.*$`) : `__${searchValue}__`;
    const replace = removingLines ? '' : value;
    shell.sed('-i', search, replace, file);
  });
}

const replaceKeys = (arrayOfFiles, replaceValues) => arrayOfFiles.forEach(src => replaceKeysForFiles(src, { replaceValues }));

const removeKeyLines = (arrayOfFiles, removeValues, keepLines) => arrayOfFiles.forEach(src => replaceKeysForFiles(src, { removeValues, keepLines }));

const jsonParse = jsonString => {
  try {
    const parse = JSON.parse(jsonString);
    return parse;
  } catch (err) {
    log.error('Could not get scripts version for saving settings.');
    return undefined;
  }
}

const saveSettings = settings => {
  const file = '.jkallunki-scripts';
  const script = jsonParse(readSrcFile('package.json'));
  settings.version = script.version;
  shell.ShellString(prettier.format(JSON.stringify(settings), { parser: "json" })).to(file);
}

module.exports = {
  lodashPick, objValueMap, log, createFile, createDir, getTmp, rmFile, runPrettier, replaceKeysForFiles, replaceKeys, removeKeyLines, cpFile, saveSettings
};