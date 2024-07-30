'use strict';

const paths = require('./paths.js');

const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

const dllPath = paths.getDllPath();

async function compileAndSignSobre() {
  try {
    const { stdout, stderr } = await execAsync(`dotnet ${dllPath}`);
    let logCompileAndSignSobre = stdout.trim().split('\n');
    console.log(logCompileAndSignSobre);
    if (stderr) {
      logCompileAndSignSobre = `ERROR MakeEnvio.cs logs:\n ${stderr}`;
      console.error(logCompileAndSignSobre);
    }
    return logCompileAndSignSobre;
  } catch (error) {
    const errorLog = `Error running C# .dll to sign DTE's: ${error}`;
    console.log(errorLog);
    return errorLog;
  }
}

module.exports = { compileAndSignSobre };
