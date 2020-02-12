import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
import path = require('path');

async function run() {
    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));
        
        let executablePSPath: string = path.join(__dirname, 'simplecrossplatformv1-worker.ps1');

        console.log('Launching TypeScript startup');
        console.log('Found executablePSPath=',executablePSPath);

        let sampleStringVariable = tl.getInput('sampleString', true);
        
        console.log('Retrieving variables');

        let scriptArguments = ` -sampleStringVariable ' ${sampleStringVariable}'`;
        
        console.log('========================== Starting Command Output (Calling the worker class with parameters) ===========================');
        let powershell = tl.tool(tl.which('pwsh') || tl.which('powershell') || tl.which('pwsh', true))
            .arg('-NoLogo')
            .arg('-NoProfile')
            .arg('-NonInteractive')
            .arg('-Command')
            .arg(`. '${executablePSPath.replace("'", "''")}' ${scriptArguments}`);

            let options = <tr.IExecOptions>{
                cwd: '',
                failOnStdErr: false,
                errStream: process.stdout, // Direct all output to STDOUT, otherwise the output may appear out
                outStream: process.stdout, // of order since Node buffers it's own STDOUT but not STDERR.
                ignoreReturnCode: true
            };
    
            // Listen for stderr.
            // This is optional and can be removed if not required for the default behavior
            let stderrFailure = false;
            const aggregatedStderr: string[] = [];
            
            powershell.on('stderr', (data: Buffer) => {
                stderrFailure = true;
                // Truncate to at most 10 error messages
                if (aggregatedStderr.length < 10) {
                    // Truncate to at most 1000 bytes
                    if (data.length > 1000) {
                        aggregatedStderr.push(`${data.toString('utf8', 0, 1000)}<truncated>`);
                    } else {
                        aggregatedStderr.push(data.toString('utf8'));
                    }
                } else if (aggregatedStderr.length === 10) {
                    aggregatedStderr.push('Additional writes to stderr truncated');
                }
            });
    
            // Run bash.
            let exitCode: number = await powershell.exec(options);
    
            // Fail on exit code.
            if (exitCode !== 0) {
                tl.setResult(tl.TaskResult.Failed, tl.loc('JS_ExitCode', exitCode));
            }
    
            // Fail on stderr.
            if (stderrFailure) {
                tl.setResult(tl.TaskResult.Failed, tl.loc('JS_Stderr'));
                aggregatedStderr.forEach((err: string) => {
                    tl.error(err);
                });
            }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message || 'run() failed');
    }
}

run();