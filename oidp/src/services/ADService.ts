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
export class ADService
{
    public async CreateUser(userId: string)
    {
        await this.Exec(["samba-tool", "user", "add", userId, "--random-password"]);
    }

    //Private methods
    private Exec(command: string[])
    {
        const line = command.join(" ");

        return new Promise<void>( (resolve, reject) => {
            child_process.exec(line, error => {
                if(error)
                    reject(error);
                else
                    resolve();
            });
        });
    }
}