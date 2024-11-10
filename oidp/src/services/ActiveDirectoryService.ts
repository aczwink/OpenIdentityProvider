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
import crypto from "crypto";
import os from "os";
import child_process from "child_process";
import { Injectable } from "acts-util-node";
import { UserAccountsController } from "../data-access/UserAccountsController";
import { CONFIG_DOMAIN } from "../config";
import { DNSRecord } from "../data-access/DNSController";
import { ConfigController } from "../data-access/ConfigController";

interface ComputerProperties
{
    dNSHostName: string;
    name: string;
    operatingSystem: string;
    operatingSystemVersion: string;
}

const admin_sAMAccountName = "administrator";
const initialAdminPW = "AdminPW1234!";

@Injectable
export class ActiveDirectoryService
{
    constructor(private userAccountsController: UserAccountsController, private configController: ConfigController)
    {
    }

    //Public methods
    public async CreateDNSRecord(record: DNSRecord)
    {
        const domainName = this.GetDomainControllerDomainName();
        await this.ExecWithLogin(["samba-tool", "dns", "add", domainName, CONFIG_DOMAIN.domain, record.label, record.recordType, record.value]);
    }

    public async CreateUser(userId: number)
    {
        const sAMAccountName = await this.MapTo_sAMAccountName(userId);
        await this.Exec(["samba-tool", "user", "add", sAMAccountName, "--random-password"]);
    }

    public async DeleteDNSRecord(record: DNSRecord)
    {
        const domainName = this.GetDomainControllerDomainName();
        await this.ExecWithLogin(["samba-tool", "dns", "delete", domainName, CONFIG_DOMAIN.domain, record.label, record.recordType, record.value]);
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
                DOMAINPASS: initialAdminPW,
                HOSTIP: CONFIG_DOMAIN.dcIP_Address,
                NOCOMPLEXITY: "true" //passwords are managed via OIDP
            },
        });
        adInitProcess.stderr.setEncoding("utf-8");
        adInitProcess.stdout.setEncoding("utf-8");
        adInitProcess.stderr.on("data", console.error);
        adInitProcess.stdout.on("data", console.error);
    }

    public async ListComputers()
    {
        const stdout = await this.Exec(["samba-tool", "computer", "list"])
        return stdout.trim().split("\n");
    }

    public async FetchComputerDetails(computerName: string)
    {
        const stdout = await this.Exec(["samba-tool", "computer", "show", computerName])
        const lines = stdout.trim().split("\n");
        const kvs = lines.Values().Map(x => {
            const idx = x.indexOf(":");

            return {
                kev: x.substring(0, idx),
                value: x.substring(idx + 2)
            };
        });

        const dict = kvs.GroupBy(x => x.kev).ToDictionary(x => x.value[0].kev, x => (x.value.length === 1) ? x.value[0].value : x.value.map(y => y.value));
        return dict as unknown as ComputerProperties;
    }

    public async SetUserPassword(userId: number, newPassword: string)
    {
        const sAMAccountName = await this.MapTo_sAMAccountName(userId);
        await this.SetUserPasswordInternal(sAMAccountName, newPassword);
    }

    //Private methods
    private Exec(command: string[])
    {
        const line = command.join(" ");

        return new Promise<string>( (resolve, reject) => {
            child_process.exec(line, (error, stdout) => {
                if(error)
                    reject(error);
                else
                    resolve(stdout);
            });
        });
    }

    private async ExecWithLogin(command: string[])
    {
        const line = command.join(" ");

        const child = child_process.spawn(line, {
            env: {
                PASSWD: await this.GetAdminPassword(),
                USER: admin_sAMAccountName,
            },
            shell: true
        });
        child.stderr.setEncoding("utf-8");
        child.stdout.setEncoding("utf-8");
        child.stderr.on("data", console.error);
        child.stdout.on("data", console.error);

        return new Promise<void>( (resolve, reject) => {
            child.on("exit", code => {
                if(code !== 0)
                    reject();
                else
                    resolve();
            });
        });
    }

    private async GetAdminPassword()
    {
        const configKey = "AD_Admin_PW";
        const pw = await this.configController.Query(configKey);
        if(pw === undefined)
        {
            const random = crypto.randomBytes(32).toString("hex");
            const newPW = "#" + random + "!";

            await this.SetUserPasswordInternal(admin_sAMAccountName, newPW);
            await this.configController.Set(configKey, newPW);

            return newPW;
        }

        return pw;
    }

    private GetDomainControllerDomainName()
    {
        return os.hostname() + "." + CONFIG_DOMAIN.domain;
    }

    private async MapTo_sAMAccountName(userId: number)
    {
        const account = await this.userAccountsController.Query(userId);
        return account.givenName;
    }

    private async SetUserPasswordInternal(sAMAccountName: string, newPassword: string)
    {
        //there is currently no better option that this. The stdin method does not work reliably
        await this.Exec(["samba-tool", "user", "setpassword", sAMAccountName, "--newpassword=" + newPassword]);
    }
}