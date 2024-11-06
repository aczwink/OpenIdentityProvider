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
import { UserAccountsController } from "../data-access/UserAccountsController";
import { CONFIG_DOMAIN } from "../config";

@Injectable
export class ADService
{
    constructor(private userAccountsController: UserAccountsController)
    {
    }

    public async CreateUser(userId: number)
    {
        const sAMAccountName = await this.MapTo_sAMAccountName(userId);
        await this.Exec(["samba-tool", "user", "add", sAMAccountName, "--random-password"]);
    }

    public async DeleteUser(userId: number)
    {
        const sAMAccountName = await this.MapTo_sAMAccountName(userId);
        await this.Exec(["samba-tool", "user", "delete", sAMAccountName]);
    }

    public Initialize()
    {
        const adInitProcess = child_process.spawn("/init.sh", {
            env: {
                DNSFORWARDER: CONFIG_DOMAIN.dnsForwarderIP,
                DOMAIN: CONFIG_DOMAIN.domain.toUpperCase(),
                DOMAIN_DC: CONFIG_DOMAIN.domain.split(".").map(x => "dc=" + x).join(","),
                DOMAIN_EMAIL: CONFIG_DOMAIN.domain,
                DOMAINPASS: "AdminPW1234!",
                HOSTIP: CONFIG_DOMAIN.dcIP_Address,
            },
        });
        adInitProcess.stderr.setEncoding("utf-8");
        adInitProcess.stdout.setEncoding("utf-8");
        adInitProcess.stderr.on("data", console.error);
        adInitProcess.stdout.on("data", console.error);
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

    private async MapTo_sAMAccountName(userId: number)
    {
        const account = await this.userAccountsController.Query(userId);
        return account.givenName;
    }
}