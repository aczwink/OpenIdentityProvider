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
import { UserAccountData } from "../data-access/UserAccountsController";
import { CONFIG_AD_DOMAIN } from "../env";
import { DNSRecord, DNSZone } from "../data-access/DNSController";
import { ConfigController } from "../data-access/ConfigController";
import { Of } from "acts-util-core";
import { CommandExecutor } from "./CommandExecutor";

export interface ActiveDirectoryUserNames
{
    netBiosName: string;
    sAMAccountName: string;
    userPrincipalName: string;
}

interface ComputerProperties
{
    dNSHostName: string;
    name: string;
    operatingSystem: string;
    operatingSystemVersion: string;
}

const admin_sAMAccountName = "administrator";
const initialAdminPW = "AdminPW1234!";

//GPO documentation for samba: https://wiki.samba.org/index.php/Group_Policy

@Injectable
export class ActiveDirectoryService
{
    constructor(private configController: ConfigController, private commandExecutor: CommandExecutor
    )
    {
    }

    //Public methods
    public async AddGroupToDomainAdmins(sAMAccountName: string)
    {
        await this.commandExecutor.Exec(["samba-tool", "group", "addmembers", "Domain Admins", sAMAccountName]);
    }

    public async AddMemberToGroup(group_sAMAccountName: string, user_sAMAccountName: string)
    {
        await this.commandExecutor.Exec(["samba-tool", "group", "addmembers", group_sAMAccountName, user_sAMAccountName]);
    }

    public async CreateDNSRecord(zone: DNSZone, record: DNSRecord)
    {
        const dcName = this.GetDomainControllerDomainName();
        await this.ExecWithLogin(["samba-tool", "dns", "add", dcName, zone.name, record.label, record.recordType, record.value]);
    }

    public async CreateDNSZone(name: string)
    {
        const dcName = this.GetDomainControllerDomainName();
        await this.ExecWithLogin(["samba-tool", "dns", "zonecreate", dcName, name]);
    }

    public async CreateGroup(sAMAccountName: string)
    {
        const result = await this.commandExecutor.ExecWithExitCode([
            "samba-tool", "group", "add",
            sAMAccountName,
        ]);
        if(result.exitCode !== 0)
            return "error_object_exists";
    }

    public async CreateUser(sAMAccountName: string, account: UserAccountData)
    {
        const args = [];
        if(account.type === "human")
        {
            args.push(
                "--given-name", account.givenName,
                "--mail-address", account.eMailAddress,
            );
        }

        const result = await this.commandExecutor.ExecWithExitCode([
            "samba-tool", "user", "add",
            sAMAccountName,
            "--random-password",
            ...args,
        ]);
        if(result.exitCode !== 0)
            return "error_object_exists";
    }

    public async DeleteDNSRecord(zone: DNSZone, record: DNSRecord)
    {
        const dcName = this.GetDomainControllerDomainName();
        await this.ExecWithLogin(["samba-tool", "dns", "delete", dcName, zone.name, record.label, record.recordType, record.value]);
    }

    public async DeleteDNSZone(name: string)
    {
        const dcName = this.GetDomainControllerDomainName();
        await this.ExecWithLogin(["samba-tool", "dns", "zonedelete", dcName, name]);
    }

    public async DeleteGroup(sAMAccountName: string)
    {
        await this.commandExecutor.Exec([
            "samba-tool", "group", "delete",
            sAMAccountName,
        ]);
    }

    public async DeleteUser(sAMAccountName: string)
    {
        await this.commandExecutor.Exec(["samba-tool", "user", "delete", sAMAccountName]);
    }

    public async GetUserNames(sAMAccountName: string)
    {
        return Of<ActiveDirectoryUserNames>({
            netBiosName: CONFIG_AD_DOMAIN.domain.split(".")[0].toUpperCase() + "\\" + sAMAccountName,
            sAMAccountName,
            userPrincipalName: sAMAccountName + "@" + CONFIG_AD_DOMAIN.domain
        });
    }

    public Initialize()
    {
        const adInitProcess = child_process.spawn("/init.sh", {
            env: {
                DNSFORWARDER: CONFIG_AD_DOMAIN.dnsForwarderIP,
                DOMAIN: CONFIG_AD_DOMAIN.domain.toUpperCase(),
                DOMAIN_DC: CONFIG_AD_DOMAIN.domain.split(".").map(x => "dc=" + x).join(","),
                DOMAIN_EMAIL: CONFIG_AD_DOMAIN.domain,
                DOMAINPASS: initialAdminPW,
                HOSTIP: CONFIG_AD_DOMAIN.dcIP_Address,
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
        const stdout = await this.commandExecutor.Exec(["samba-tool", "computer", "list"])
        return stdout.trim().split("\n");
    }

    public async FetchComputerDetails(computerName: string)
    {
        const stdout = await this.commandExecutor.Exec(["samba-tool", "computer", "show", computerName])
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

    public async RemoveGroupFromDomainAdmins(sAMAccountName: string)
    {
        await this.commandExecutor.Exec(["samba-tool", "group", "removemembers", "Domain Admins", sAMAccountName]);
    }

    public async RemoveMemberFromGroup(group_sAMAccountName: string, user_sAMAccountName: string)
    {
        await this.commandExecutor.Exec(["samba-tool", "group", "removemembers", group_sAMAccountName, user_sAMAccountName]);
    }

    public async SetUserPassword(sAMAccountName: string, newPassword: string)
    {
        await this.SetUserPasswordInternal(sAMAccountName, newPassword);
    }

    //Private methods
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
        return os.hostname() + "." + CONFIG_AD_DOMAIN.domain;
    }

    /**
     * Be aware that calling this, automatically enables a user!
     */
    private async SetUserPasswordInternal(sAMAccountName: string, newPassword: string)
    {
        //there is currently no better option that this. The stdin method does not work reliably
        await this.commandExecutor.Exec(["samba-tool", "user", "setpassword", sAMAccountName, '--newpassword="' + newPassword + '"']);
    }
}