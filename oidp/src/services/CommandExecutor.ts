/**
 * OpenIdentityProvider
 * Copyright (C) 2024 Amir Czwink (amir130@hotmail.de)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * */
import child_process from "child_process";
import { Injectable } from "acts-util-node";

@Injectable
export class CommandExecutor
{
    public Exec(command: string[], workingDirectory?: string)
    {
        const line = command.map(this.EscapeCommandArg.bind(this)).join(" ");

        return new Promise<string>( (resolve, reject) => {
            child_process.exec(line, { cwd: workingDirectory }, (error, stdout) => {
                if(error)
                    reject(error);
                else
                    resolve(stdout);
            });
        });
    }

    public ExecWithExitCode(command: string[])
    {
        const line = command.map(this.EscapeCommandArg.bind(this)).join(" ");

        const child = child_process.spawn(line, {
            shell: true,
        });
        child.stderr.setEncoding("utf-8");
        child.stderr.on("data", console.error);
        
        let stdOut = "";
        child.stdout.setEncoding("utf-8");
        child.stdout.on("data", x => stdOut += x);

        return new Promise<{ exitCode: number; stdOut: string; }>( resolve => {
            child.on("exit", exitCode => {
                resolve({ exitCode: exitCode!, stdOut });
            });
        });
    }

    public ExecBinary(command: string[])
    {
        const line = command.map(this.EscapeCommandArg.bind(this)).join(" ");

        const child = child_process.spawn(line, {
            shell: true
        });

        const buffers: Buffer[] = [];
        child.stderr.setEncoding("utf-8");
        child.stderr.on("data", console.error);
        child.stdout.on("data", x => buffers.push(x));

        return new Promise<Buffer>( (resolve, reject) => {
            child.on("exit", code => {
                if(code !== 0)
                    reject();
                else
                    resolve(Buffer.concat(buffers));
            });
        });
    }

    //Private methods
    private EscapeCommandArg(arg: string)
    {
        if(arg.includes(' '))
            return '"' + arg + '"';
        return arg;
    }
}