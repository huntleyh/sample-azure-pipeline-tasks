import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
import path = require('path');
import fs = require('fs');
var uuidV4 = require('uuid/v4');

async function translateDirectoryPath(bashPath: string, directoryPath: string): Promise<string> {
    let bashPwd = tl.tool(bashPath)
        .arg('-c')
        .arg('pwd');

    let bashPwdOptions = <tr.IExecOptions>{
        cwd: directoryPath,
        failOnStdErr: true,
        errStream: process.stdout,
        outStream: process.stdout,
        ignoreReturnCode: false
    };
    let pwdOutput = '';
    bashPwd.on('stdout', (data: { toString: () => string; }) => {
        pwdOutput += data.toString();
    });
    await bashPwd.exec(bashPwdOptions);
    pwdOutput = pwdOutput.trim();
    if (!pwdOutput) {
        throw new Error(tl.loc('JS_TranslatePathFailed', directoryPath));
    }

    return `${pwdOutput}`;
}

/**
 * Set value for `BASH_ENV` environment variable
 * 
 * The pipeline task invokes bash as non-interactive shell. In this mode Bash looks only for `BASH_ENV` environment variable. 
 * The value of `BASH_ENV` is expanded and used as the name of a startup file to read before executing the script.
 * 
 * If the environment variable `BASH_ENV` has already been defined, the function will override this variable only for the current task.
 * 
 * @param {string} valueToSet - Value that will be set to `BASH_ENV` environment variable
 */
function setBashEnvVariable(valueToSet: string): void {
    const bashEnv: string = `${process.env["BASH_ENV"]}`;

    if (bashEnv) {
        console.log(tl.loc('JS_BashEnvAlreadyDefined', bashEnv, valueToSet));
    }

    process.env["BASH_ENV"] = valueToSet;
    tl.debug(`The BASH_ENV environment variable was set to ${valueToSet}`);
}

async function run() {
    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));

        console.log('Launching TypeScript startup');

        // Get inputs.
        let input_failOnStderr = tl.getBoolInput('failOnStderr', false);
        let input_workingDirectory = tl.getPathInput('workingDirectory', /*required*/ true, /*check*/ true);
        let input_input1Variable = tl.getInput('input1', true);
        
        let old_source_behavior: boolean;

        let executable_file_path: string = path.join(__dirname, 'my_bash_script.sh');
        old_source_behavior = !!process.env['AZP_BASHV3_OLD_SOURCE_BEHAVIOR'];

        if (!tl.stats(executable_file_path).isFile()) {
            throw new Error(tl.loc('JS_InvalidFilePath', executable_file_path));
        }

        console.log('Found executable_file_path=', executable_file_path);        

        let script_arguments: string = `${input_input1Variable}`;// Generate the script contents.
        console.log(tl.loc('GeneratingScript'));
        let bashPath: string = tl.which('bash', true);
        let contents: string;
        
        // Translate the target file path from Windows to the Linux file system.
        let targetFilePath: string;
        if (process.platform == 'win32') {
            targetFilePath = await translateDirectoryPath(bashPath, path.dirname(executable_file_path)) + '/' + path.basename(executable_file_path);
        }
        else {
            targetFilePath = executable_file_path;
        }

        // Choose behavior:
        // If they've set old_source_behavior, source the script. This is what we used to do and needs to hang around forever for back compat reasons
        // If they've not, execute the script with bash. This is our new desired behavior.
        // See https://github.com/Microsoft/azure-pipelines-tasks/blob/master/docs/bashnote.md
        if (old_source_behavior) {
            contents = `. '${targetFilePath.replace(/'/g, "'\\''")}' ${script_arguments}`.trim();
        } else {
            contents = `exec bash '${targetFilePath.replace(/'/g, "'\\''")}' ${script_arguments}`.trim();
        }
        console.log(tl.loc('JS_FormattedCommand', contents));
        
        // Write the script to disk.
        tl.assertAgent('2.115.0');
        let tempDirectory = tl.getVariable('agent.tempDirectory');
        tl.checkPath(`${tempDirectory}` , `${tempDirectory} (agent.tempDirectory)`);
        let fileName = uuidV4() + '.sh';
        let filePath = path.join(`${tempDirectory}`, fileName);
        await fs.writeFileSync(
            filePath,
            contents,
            { encoding: 'utf8' });

        // Translate the script file path from Windows to the Linux file system.
        if (process.platform == 'win32') {
            filePath = await translateDirectoryPath(bashPath, `${tempDirectory}`) + '/' + fileName;
        }

        // Create the tool runner.
        console.log('========================== Starting Command Output ===========================');
        let bash = tl.tool(bashPath);
        bash.arg(filePath);

        let options = <tr.IExecOptions>{
            cwd: input_workingDirectory,
            failOnStdErr: false,
            errStream: process.stdout, // Direct all output to STDOUT, otherwise the output may appear out
            outStream: process.stdout, // of order since Node buffers it's own STDOUT but not STDERR.
            ignoreReturnCode: true
        };

        process.on("SIGINT", () => {
            tl.debug('Started cancellation of executing script');
            bash.killChildProcess();
        });

        // Listen for stderr.
        let stderrFailure = false;
        const aggregatedStderr: string[] = [];
        if (input_failOnStderr) {
            bash.on('stderr', (data: Buffer) => {
                stderrFailure = true;
                aggregatedStderr.push(data.toString('utf8'));
            });
        }

        // Run bash.
        let exitCode: number = await bash.exec(options);

        let result = tl.TaskResult.Succeeded;

        // Fail on exit code.
        if (exitCode !== 0) {
            tl.error(tl.loc('JS_ExitCode', exitCode));
            result = tl.TaskResult.Failed;
        }

        // Fail on stderr.
        if (stderrFailure) {
            tl.error(tl.loc('JS_Stderr'));
            aggregatedStderr.forEach((err: string) => {
                tl.error(err);
            });
            result = tl.TaskResult.Failed;
        }

        tl.setResult(result, '', true);
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message || 'run() failed', true);
    }
}

run();