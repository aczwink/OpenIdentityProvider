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
import fs from "fs";
import readline from "readline";
import { Writable } from "stream";
import { GlobalInjector } from "acts-util-node";
import { SCOPE_ADMIN } from "./api_security";
import { AppRegistrationsController } from "./data-access/AppRegistrationsController";
import { ClaimsController } from "./data-access/ClaimsController";
import { PasswordValidationService } from "./services/PasswordValidationService";
import { UserGroupsManager } from "./services/UserGroupsManager";
import { UsersManager } from "./services/UsersManager";
import { PKIManager } from "./services/PKIManager";
import { ClientsController } from "./data-access/ClientsController";
import { CONFIG_OIDC_ISSUER } from "./env";
import { ConfigController } from "./data-access/ConfigController";
import { UserAccountsController } from "./data-access/UserAccountsController";
import { ActiveDirectoryIntegrationService } from "./services/ActiveDirectoryIntegrationService";
import { GroupsController } from "./data-access/GroupsController";

function ReadLineFromStdIn(prompt: string, hide: boolean)
{
    const muted = new Writable({
        write: function(chunk, encoding, callback)
        {
            callback();
        }
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: hide ? muted : process.stdout,
        terminal: true
    });

    const promptLine = prompt + ": ";
    if(hide)
        process.stdout.write(promptLine);
    return new Promise<string>(resolve => {
        rl.question(promptLine, answer => {
            rl.close();
            if(hide)
                console.log();
            resolve(answer);
        });
    });
}

async function ReadPassword()
{
    const password = await ReadLineFromStdIn("Please provide a password", true);

    const passwordValidationService = GlobalInjector.Resolve(PasswordValidationService);
    const result = passwordValidationService.Validate(password);
    if(result !== undefined)
    {
        console.log("Password not valid: " + result);
        console.log("Try a different one...");
        return await ReadPassword();
    }

    const confirmed = await ReadLineFromStdIn("Please confirm your password", true);
    if(password !== confirmed)
    {
        console.log("Passwords don't match! Try again...");
        return await ReadPassword();
    }
    return password;
}

async function ExecMgmtCommand(command: string | undefined, args: string[])
{
    switch(command)
    {
        case "bootstrap":
        {
            console.log("Creating a user account for you...");
            const eMailAddress = await ReadLineFromStdIn("Please enter your email address", false);
            const password = await ReadPassword();

            const usersManager = GlobalInjector.Resolve(UsersManager);
            const userId = await usersManager.CreateUser({
                type: "human",
                eMailAddress,
                givenName: eMailAddress
            }) as number;
            const error = await usersManager.SetPassword(userId, password);
            if(error)
                console.log("Error while setting users password: ", error);
            else
                console.log("User", eMailAddress, "was created successfully.");

            const userGroupsManager = GlobalInjector.Resolve(UserGroupsManager);
            const groupId = await userGroupsManager.Create({ name: "Admins" }) as number;
            await userGroupsManager.AddMember(groupId, userId);

            const appRegistrationsController = GlobalInjector.Resolve(AppRegistrationsController);
            const appRegId = await appRegistrationsController.Create({
                audience: CONFIG_OIDC_ISSUER,
                displayName: "OpenIdentityProvider"
            });
            const clientsController = GlobalInjector.Resolve(ClientsController);
            await clientsController.Create({
                appRegistrationId: appRegId,
                id: "00000000-0000-0000-0000-000000000000",
                name: "WebPortal",
                postLogoutRedirectURIs: ["https://localhost:8081/oauth2loggedout"],
                redirectURIs: ["https://localhost:8081/oauth2loggedin"],
                type: "authorization_code",
                appUserId: null
            });

            const claimsController = GlobalInjector.Resolve(ClaimsController);
            const claimId = await claimsController.AddVariable(appRegId, {
                claimName: "scope",
                claimType: "string-list-space-separated"
            });
            await claimsController.AddValue(claimId, { groupId, value: "openid" });
            await claimsController.AddValue(claimId, { groupId, value: "email" });
            await claimsController.AddValue(claimId, { groupId, value: "profile" });
            await claimsController.AddValue(claimId, { groupId, value: SCOPE_ADMIN });

            console.log("Initial configuration complete :)");
        }
        break;
        case "pki":
        {
            const pkiManager = GlobalInjector.Resolve(PKIManager);

            const caCrt = await pkiManager.LoadCACert();

            await fs.promises.writeFile("./ca.crt", caCrt, "utf-8");

            console.log("PKI successfully written to current working directory.");
        }
        break;
        case "rebuild-ad":
        {
            const configController = GlobalInjector.Resolve(ConfigController);
            const userAccountsController = GlobalInjector.Resolve(UserAccountsController);
            const groupsController = GlobalInjector.Resolve(GroupsController);
            const activeDirectoryIntegrationService = GlobalInjector.Resolve(ActiveDirectoryIntegrationService);

            await configController.Delete("AD_Admin_PW");

            const users = await userAccountsController.QueryAll();
            for (const user of users)
            {
                const userData = await userAccountsController.QueryByExternalId(user.id);
                const uid = 3000000 + (await userAccountsController.QueryInternalId(user.id))!;
                await activeDirectoryIntegrationService.SetUser(userData!, uid);

                console.log("Successfully synced user", user.name);
            }

            const groups = await groupsController.QueryAll();
            for (const group of groups)
            {
                const members = await userAccountsController.QueryMembers(group.id);
                const fullMembers = await members.Values().Map(x => userAccountsController.QueryByExternalId(x.id)).Async().NotUndefined().ToArray();
                await activeDirectoryIntegrationService.SetGroup(group.name, fullMembers);

                console.log("Successfully synced group", group.name);
            }

            console.log("Done rebuilding AD. Users have to change their password and computers have to be joined manually again :S");
        }
        break;
        default:
            console.error("Unknown management command: " + command);
    }
}

const command = process.argv[2];
ExecMgmtCommand(command, process.argv.slice(3));