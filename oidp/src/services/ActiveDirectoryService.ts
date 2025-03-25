/**
 * OpenIdentityProvider
 * Copyright (C) 2024-2025 Amir Czwink (amir130@hotmail.de)
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
import fs from "fs";
import { Injectable } from "acts-util-node";
import { UserAccountData } from "../data-access/UserAccountsController";
import ENV from "../env";
import { DNSRecord, DNSRecordType, DNSZone } from "../data-access/DNSController";
import { ConfigController } from "../data-access/ConfigController";
import { Of } from "acts-util-core";
import { CommandExecutor } from "./CommandExecutor";

enum SambaToolAuth
{
    None,
    LDB_URL,
    IPAddressRealmAndWorkgroup
}

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

interface GPOProperties
{
    gpoId: string;
    displayName: string;
}

interface DWORDValue
{
    type: "REG_DWORD";
    data: number;
}

interface StringValue
{
    type: "REG_EXPAND_SZ" | "REG_SZ";
    data: string;
}

type GPOValue = DWORDValue | StringValue;

interface GPOPolicyVariableDefinition
{
    class: "MACHINE" | "USER";
    keyname: string;
    valuename: string;
}

export type GPOPolicyValueDefinition = GPOPolicyVariableDefinition & GPOValue;

interface UserProperties
{
    givenName?: string;
    mail?: string;
    uidNumber?: string;
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
        await this.AddMemberToGroup("Domain Admins", sAMAccountName);
    }

    public async AddMemberToGroup(group_sAMAccountName: string, user_sAMAccountName: string)
    {
        await this.CallSambaTool(["group", "addmembers", group_sAMAccountName, user_sAMAccountName], SambaToolAuth.LDB_URL);
    }

    public async AddMessageOfTheDayPolicyToGPO(gpoId: string, message: string)
    {
        await this.CallSambaTool(["gpo", "manage", "motd", "set", gpoId, message], SambaToolAuth.IPAddressRealmAndWorkgroup);
    }

    public async AddPolicyToGPO(gpoId: string, policyDefinition: GPOPolicyValueDefinition[])
    {
        /*
        #TODO: we require samba 4.20 at least (for loading GPOs; 4.19 has a bug)
        #TODO: even for ubuntu:25.04 samba remote auth seems to be broken :S
        #TODO: even for ubuntu:latest the remote loading does not seem to be possible -.-
        For now we write this into a file to a shared location by this and the AD container, and the AD container will import it

        const stdin = JSON.stringify(policyDefinition);
        await this.CallSambaTool(["gpo", "load", gpoId], SambaToolAuth.LDB_URL, stdin);
        */

        const adminPW = await this.GetAdminPassword();

        const authPath = "/srv/OpenIdentityProvider/gpos/AUTH";
        await fs.promises.writeFile(authPath, "username=Administrator\npassword=" + adminPW);

        const gpoPath = "/srv/OpenIdentityProvider/gpos/" + gpoId;
        await fs.promises.writeFile(gpoPath, JSON.stringify(policyDefinition));
    }

    public async AddStartupScriptPolicyToGPO(gpoId: string, scriptPath: string)
    {
        await this.CallSambaTool(["gpo", "manage", "scripts", "startup", "add", gpoId, scriptPath], SambaToolAuth.IPAddressRealmAndWorkgroup);
    }

    public async CreateDNSRecord(zoneName: string, record: DNSRecord)
    {
        const dcName = this.GetDomainControllerDomainName();
        await this.CallSambaTool(["dns", "add", dcName, zoneName, record.label, record.recordType, record.value], SambaToolAuth.None);
    }

    public async CreateDNSZone(name: string)
    {
        const dcName = this.GetDomainControllerDomainName();
        await this.CallSambaTool(["dns", "zonecreate", dcName, name], SambaToolAuth.None);
    }

    public async CreateGPO(displayName: string)
    {
        const result = await this.CallSambaTool(["gpo", "create", displayName], SambaToolAuth.IPAddressRealmAndWorkgroup);
        const lines = result.stdOut.trim().split("\n");
        const lastLine = lines[lines.length - 1];
        const parts = lastLine.split(" ");
        return parts[parts.length - 1];
    }

    public async CreateGroup(sAMAccountName: string)
    {
        const result = await this.CallSambaToolWithExitCode([
            "group", "add",
            sAMAccountName,
        ], SambaToolAuth.LDB_URL);

        if(result.exitCode !== 0)
            return "error_object_exists";
    }

    public async CreateUser(sAMAccountName: string, account: UserAccountData, uid: number)
    {
        const names = await this.GetUserNames(sAMAccountName);

        const args = [];
        if(account.type === "human")
        {
            args.push(
                "--given-name", account.givenName,
                "--mail-address", account.eMailAddress,
                //unix attributes
                "--uid-number=" + uid,
                "--login-shell=/bin/bash",
                "--unix-home=/home/" + names.userPrincipalName,
            );
        }

        const result = await this.CallSambaToolWithExitCode([
            "user", "add",
            sAMAccountName,
            "--random-password",
            ...args,
        ], SambaToolAuth.LDB_URL);
        
        if(result.exitCode !== 0)
            return "error_object_exists";
    }

    public async DeleteDNSRecord(zone: DNSZone, record: DNSRecord)
    {
        const dcName = this.GetDomainControllerDomainName();
        await this.CallSambaTool(["dns", "delete", dcName, zone.name, record.label, record.recordType, record.value], SambaToolAuth.None);
    }

    public async DeleteDNSZone(name: string)
    {
        const dcName = this.GetDomainControllerDomainName();
        await this.CallSambaTool(["dns", "zonedelete", dcName, name], SambaToolAuth.None);
    }

    public async DeleteGPO(gpoId: string)
    {
        await this.CallSambaTool(["gpo", "del", gpoId], SambaToolAuth.IPAddressRealmAndWorkgroup);
    }

    public async DeleteGroup(sAMAccountName: string)
    {
        await this.CallSambaTool(["group", "delete", sAMAccountName], SambaToolAuth.LDB_URL);
    }

    public async DeleteUser(sAMAccountName: string)
    {
        await this.CallSambaTool(["user", "delete", sAMAccountName], SambaToolAuth.LDB_URL);
    }

    public async FetchComputerDetails(computerName: string)
    {
        const { stdOut } = await this.CallSambaTool(["computer", "show", computerName], SambaToolAuth.LDB_URL);
        const dict = this.ParseLineBasedKeyValuePairs(stdOut);

        return dict as unknown as ComputerProperties;
    }

    public async GetUserNames(sAMAccountName: string)
    {
        return Of<ActiveDirectoryUserNames>({
            netBiosName: this.GetNetBiosName() + "\\" + sAMAccountName,
            sAMAccountName,
            userPrincipalName: sAMAccountName + "@" + ENV.AD_DOMAIN.domain
        });
    }

    public async InstallSambaGPOs()
    {
        await this.CallSambaTool(["gpo", "admxload"], SambaToolAuth.IPAddressRealmAndWorkgroup);
    }

    public async LinkGPOToDomain(gpoId: string)
    {
        const containerName = this.GetDomainDistinguishedName();
        await this.CallSambaTool(["gpo", "setlink", containerName, gpoId], SambaToolAuth.IPAddressRealmAndWorkgroup);
    }

    public async ListComputers()
    {
        const { stdOut } = await this.CallSambaTool(["computer", "list"], SambaToolAuth.LDB_URL);
        return stdOut.trim().split("\n");
    }

    public async ListGPOs()
    {
        const result = await this.CallSambaTool(["gpo", "listall"], SambaToolAuth.LDB_URL);
        const blocks = result.stdOut.trim().split("\n\n");
        const gpos = [];
        for (const block of blocks)
        {
            const gpo: GPOProperties = {
                displayName: "",
                gpoId: ""
            };
            const kvs = this.ParseLineBasedKeyValuePairs(block);
            for (const key in kvs)
            {
                if (Object.prototype.hasOwnProperty.call(kvs, key))
                {
                    const value = kvs[key]! as string;

                    switch(key)
                    {
                        case "GPO":
                            gpo.gpoId = value;
                            break;
                        case "display name":
                            gpo.displayName = value;
                            break;
                    }
                }
            }

            gpos.push(gpo);
        }

        return gpos;
    }

    public async QueryDNSRecordValue(zoneName: string, label: string, recordType: DNSRecordType)
    {
        const dcName = this.GetDomainControllerDomainName();
        const result = await this.CallSambaToolWithExitCode(["dns", "query", dcName, zoneName, label, recordType], SambaToolAuth.None);
        if(result.exitCode === 255)
            return undefined;
        const lines = result.stdOut.trim().split("\n");
        if(lines.length !== 2)
            throw new Error("TODO");
        const parts = lines[1].trim().split(" ");
        const value = parts[1];

        return value;
    }

    public async QueryDNSZone(zoneName: string)
    {
        const dcName = this.GetDomainControllerDomainName();
        const result = await this.CallSambaToolWithExitCode(["dns", "zoneinfo", dcName, zoneName], SambaToolAuth.None);
        if(result.exitCode === 255)
            return undefined;
        if(result.exitCode === 0)
            return null;
        //const kvs = this.ParseLineBasedKeyValuePairs(result.stdOut)
        //console.log(kvs);
        throw new Error("TODO: not implemented");
    }

    public async QueryGroup(sAMAccountName: string)
    {
        const result = await this.CallSambaToolWithExitCode(["group", "show", sAMAccountName], SambaToolAuth.LDB_URL);
        if(result.exitCode === 255)
            return undefined;
        if(result.exitCode === 0)
            return null; //TODO: group exists, return data
        throw new Error("TODO: not implemented");
    }

    public async QueryGroupMembers(sAMAccountName: string)
    {
        const result = await this.CallSambaTool(["group", "listmembers", sAMAccountName], SambaToolAuth.LDB_URL);
        const lines = result.stdOut.trim();
        if(lines.length === 0)
            return [];
        return lines.split("\n");
    }

    public async QueryUser(sAMAccountName: string)
    {
        const result = await this.CallSambaToolWithExitCode(["user", "show", sAMAccountName], SambaToolAuth.LDB_URL);
        if(result.exitCode === 255)
            return undefined;
        if(result.exitCode === 0)
        {
            const kvs = this.ParseLineBasedKeyValuePairs(result.stdOut);
            return kvs as UserProperties;
        }
        throw new Error("TODO: not implemented");
    }

    public async RemoveGroupFromDomainAdmins(sAMAccountName: string)
    {
        await this.RemoveMemberFromGroup("Domain Admins", sAMAccountName);
    }

    public async RemoveMemberFromGroup(group_sAMAccountName: string, user_sAMAccountName: string)
    {
        await this.CallSambaTool(["group", "removemembers", group_sAMAccountName, user_sAMAccountName], SambaToolAuth.LDB_URL);
    }

    public async SetUserPassword(sAMAccountName: string, newPassword: string)
    {
        const adminPW = await this.GetAdminPassword();
        await this.SetUserPasswordInternal(sAMAccountName, newPassword, adminPW);
    }

    //Private methods
    private async CallSambaTool(command: string[], auth: SambaToolAuth, stdin?: string)
    {
        const result = await this.CallSambaToolWithExitCode(command, auth, stdin);
        if(result.exitCode !== 0)
            throw new Error("An error occured for command: " + command.join(" "))
        return {
            stdOut: result.stdOut
        };
    }

    private async CallSambaToolWithExitCode(command: string[], auth: SambaToolAuth, stdin?: string)
    {
        const adminPW = await this.GetAdminPassword();
        return await this.CallSambaToolAsUser(command, auth, admin_sAMAccountName, adminPW, stdin);
    }

    private async CallSambaToolAsUser(command: string[], auth: SambaToolAuth, userName: string, password: string, stdin?: string)
    {
        command.unshift("samba-tool");

        switch(auth)
        {
            case SambaToolAuth.IPAddressRealmAndWorkgroup:
                command.push(
                    "--ipaddress=" + ENV.AD_DOMAIN.dcIP_Address,
                    "--realm=" + this.GetRealm(),
                    "-W", this.GetNetBiosName(),
                );
                break;
            case SambaToolAuth.LDB_URL:
                command.push(
                    "-H", "ldap://" + this.GetDomainControllerDomainName()
                );
                break;
        }

        command.push(
            "-U", userName
        );

        return await this.commandExecutor.ExecWithExitCode(command, {
            PASSWD: password,
            USER: userName,
        }, stdin);
    }

    private async GetAdminPassword()
    {
        const configKey = "AD_Admin_PW";
        const pw = await this.configController.Query(configKey);
        if(pw === undefined)
        {
            const random = crypto.randomBytes(32).toString("hex");
            const newPW = "#" + random + "!";

            await this.SetUserPasswordInternal(admin_sAMAccountName, newPW, initialAdminPW);
            await this.configController.Set(configKey, newPW);

            return newPW;
        }

        return pw;
    }

    private GetDomainControllerDomainName()
    {
        return ENV.AD_DOMAIN.domainControllerHostName + "." + ENV.AD_DOMAIN.domain;
    }

    private GetDomainDistinguishedName()
    {
        return ENV.AD_DOMAIN.domain.split(".").map(x => "dc=" + x).join(",");
    }

    private GetNetBiosName()
    {
        return this.GetNISDomainName().toUpperCase();
    }

    private GetNISDomainName()
    {
        return ENV.AD_DOMAIN.domain.split(".")[0];
    }

    private GetRealm()
    {
        return ENV.AD_DOMAIN.domain.toUpperCase();
    }

    private ParseLineBasedKeyValuePairs(stdOut: string)
    {
        const lines = stdOut.trim().split("\n");
        const kvs = lines.Values().Map(x => {
            const idx = x.indexOf(":");

            return {
                kev: x.substring(0, idx).trim(),
                value: x.substring(idx + 2)
            };
        });

        const dict = kvs.GroupBy(x => x.kev).ToDictionary(x => x.value[0].kev, x => (x.value.length === 1) ? x.value[0].value : x.value.map(y => y.value));
        return dict;
    }

    /**
     * Be aware that calling this, automatically enables a user!
     */
    private async SetUserPasswordInternal(sAMAccountName: string, newPassword: string, adminPW: string)
    {
        //there is currently no better option that this. The stdin method does not work reliably
        const result = await this.CallSambaToolAsUser(["user", "setpassword", sAMAccountName, '--newpassword="' + newPassword + '"'], SambaToolAuth.LDB_URL, admin_sAMAccountName, adminPW);
        if(result.exitCode !== 0)
            throw new Error("TODO: couldn't set password");
    }
}